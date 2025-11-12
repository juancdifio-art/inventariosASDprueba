/// <reference types="cypress" />

import admin from '../fixtures/admin.json';

const API_URL = '/api';

const limpiarCampos = () => {
  cy.request('GET', `${API_URL}/configuracion-campos?limit=100&page=1`).then((response) => {
    const items = response.body?.data?.items ?? [];
    items
      .filter((campo) => campo.nombre.startsWith('test_'))
      .forEach((campo) => {
        cy.request('DELETE', `${API_URL}/configuracion-campos/${campo.id}`);
      });
  });
};

const crearCampo = (payload) => {
  cy.request('POST', `${API_URL}/configuracion-campos`, payload).its('status').should('eq', 201);
};

const buildCampoPayload = (overrides = {}) => ({
  nombre: 'test_codigo_alfa',
  etiqueta: 'Código Alfa',
  tipo: 'texto',
  aplica_a: 'productos',
  grupo: 'Pruebas automatizadas',
  orden: 99,
  obligatorio: false,
  visible_en_listado: true,
  visible_en_detalle: true,
  activo: true,
  ...overrides,
});

const ingresarComoAdmin = () => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type(admin.email);
  cy.get('input[type="password"]').clear().type(admin.password, { log: false });
  cy.contains('button', 'Ingresar').click();
  cy.url().should('include', '/dashboard');
};

const irAConfiguracionCampos = () => {
  cy.contains('Campos dinámicos').click();
  cy.url().should('include', '/configuracion-campos');
};

const completarFormularioCampo = (campo) => {
  cy.get('input[placeholder="ej: fecha_vencimiento"]').clear().type(campo.nombre);
  cy.get('input[placeholder="ej: Fecha de vencimiento"]').clear().type(campo.etiqueta);
  cy.get('select').eq(0).select(campo.tipo);
  cy.get('select').eq(1).select(campo.aplica_a);
  cy.get('input[placeholder="ej: Información técnica"]').clear().type(campo.grupo);
  cy.get('input[type="number"]').first().clear().type(String(campo.orden));
};

const verificarCampoEnListado = (etiqueta) => {
  cy.contains('td', etiqueta).should('be.visible');
};

const eliminarCampoDesdeUI = (etiqueta) => {
  cy.contains('tr', etiqueta).within(() => {
    cy.contains('button', 'Eliminar').click();
  });
  cy.contains('button', 'Eliminar', { matchCase: false }).filter(':visible').click();
  cy.contains('Campo eliminado correctamente', { timeout: 10000 }).should('be.visible');
};

describe('Configuración de Campos - Flujo dinámico', () => {
  before(() => {
    cy.intercept('POST', `${API_URL}/auth/login`).as('login');
    cy.intercept('GET', `${API_URL}/configuracion-campos*`).as('getCampos');
    cy.intercept('POST', `${API_URL}/configuracion-campos`).as('createCampo');
    cy.intercept('PUT', `${API_URL}/configuracion-campos/*`).as('updateCampo');
    cy.intercept('DELETE', `${API_URL}/configuracion-campos/*`).as('deleteCampo');
    cy.intercept('POST', `${API_URL}/configuracion-campos/templates/aplicar`).as('applyTemplate');
  });

  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
  });

  afterEach(() => {
    limpiarCampos();
  });

  it('permite al admin crear, editar, listar y eliminar un campo dinámico', () => {
    ingresarComoAdmin();
    cy.wait('@login');
    irAConfiguracionCampos();
    cy.wait('@getCampos');

    cy.contains('button', 'Nuevo campo').click();

    const campoCreacion = buildCampoPayload({ nombre: 'test_codigo_beta', etiqueta: 'Código Beta' });
    completarFormularioCampo(campoCreacion);
    cy.contains('button', 'Guardar').click();

    cy.wait('@createCampo').its('response.statusCode').should('eq', 201);
    cy.contains('Campo creado correctamente').should('be.visible');
    cy.wait('@getCampos');
    verificarCampoEnListado(campoCreacion.etiqueta);

    cy.contains('tr', campoCreacion.etiqueta).within(() => {
      cy.contains('button', 'Editar').click();
    });

    const campoEditado = { ...campoCreacion, etiqueta: 'Código Beta Editado', orden: 88 };
    completarFormularioCampo(campoEditado);
    cy.contains('button', 'Guardar').click();
    cy.wait('@updateCampo').its('response.statusCode').should('eq', 200);
    cy.contains('Campo actualizado correctamente').should('be.visible');
    cy.wait('@getCampos');
    verificarCampoEnListado(campoEditado.etiqueta);

    eliminarCampoDesdeUI(campoEditado.etiqueta);
    cy.wait('@deleteCampo').its('response.statusCode').should('eq', 200);
    cy.wait('@getCampos');
    cy.contains('td', campoEditado.etiqueta).should('not.exist');
  });

  it('aplica un template existente y muestra campos asociados', () => {
    limpiarCampos();

    const templateCampo = buildCampoPayload({ nombre: 'test_template_fecha', etiqueta: 'Fecha de Instalación', tipo: 'fecha', orden: 70 });
    crearCampo(templateCampo);

    ingresarComoAdmin();
    cy.wait('@login');
    irAConfiguracionCampos();
    cy.wait('@getCampos');

    limpiarCampos();
    crearCampo(templateCampo);

    cy.contains('Aplicar template').should('be.visible');
    cy.get('input[placeholder="Template"]').type('PLANTILLA_BASE');
    cy.contains('button', 'Aplicar').click();
    cy.wait('@applyTemplate');

    cy.wait('@getCampos');
    cy.contains('Campos dinámicos');
  });
});
