import { useMemo } from 'react';
import Button from '../ui/Button.jsx';

function TreeNode({
  node,
  level = 0,
  expandedNodes,
  onToggleNode,
  onSelect,
  selectedId,
}) {
  const hasChildren = Boolean(node.hijos?.length);
  const isExpanded = expandedNodes?.has(node.id);
  const isSelected = selectedId === node.id;

  const handleToggle = (event) => {
    event.stopPropagation();
    onToggleNode?.(node.id);
  };

  const handleSelect = () => {
    onSelect?.(node);
  };

  return (
    <div className="categoria-tree-node">
      <div
        className={`categoria-tree-node__row ${isSelected ? 'is-selected' : ''}`}
        style={{ paddingInlineStart: level * 16 }}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelect();
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="categoria-tree-node__toggle"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            <i className={`bi ${isExpanded ? 'bi-caret-down-fill' : 'bi-caret-right-fill'}`} />
          </button>
        ) : (
          <span className="categoria-tree-node__spacer" />
        )}
        <span className="categoria-tree-node__label">
          <i className={`bi ${hasChildren ? (isExpanded ? 'bi-folder2-open' : 'bi-folder') : 'bi-tag'}`} />
          <span title={node.nombre}>{node.nombre}</span>
        </span>
        {!node.activo && <span className="badge bg-secondary ms-2">Inactiva</span>}
        <span className="text-secondary small ms-2">#{node.id}</span>
      </div>
      {node.descripcion ? (
        <div className="categoria-tree-node__description text-secondary small" style={{ marginInlineStart: (level * 16) + 24 }}>
          {node.descripcion}
        </div>
      ) : null}
      {hasChildren && isExpanded && (
        <div className="categoria-tree-node__children">
          {node.hijos.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriaTree({
  tree = [],
  onRefresh,
  onSelect,
  selectedId = null,
  expandedNodes,
  onToggleNode,
  onExpandAll,
  onCollapseAll,
}) {
  const isEmpty = !tree || tree.length === 0;
  const totalNodes = useMemo(() => {
    const count = (nodes) => nodes.reduce((acc, n) => acc + 1 + count(n.hijos || []), 0);
    return count(tree);
  }, [tree]);

  return (
    <div className="categoria-tree card p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h5 className="mb-0">Árbol de categorías</h5>
        <div className="d-flex flex-wrap gap-2">
          {onCollapseAll && (
            <Button type="button" variant="outline-secondary" size="sm" onClick={onCollapseAll}>
              <i className="bi bi-chevron-up me-1" /> Colapsar
            </Button>
          )}
          {onExpandAll && (
            <Button type="button" variant="outline-secondary" size="sm" onClick={onExpandAll}>
              <i className="bi bi-chevron-down me-1" /> Expandir
            </Button>
          )}
          {onRefresh && (
            <Button type="button" variant="outline-secondary" size="sm" onClick={onRefresh}>
              <i className="bi bi-arrow-clockwise me-1" /> Actualizar
            </Button>
          )}
        </div>
      </div>
      {isEmpty ? (
        <div className="text-secondary">No hay categorías para mostrar.</div>
      ) : (
        <div className="categoria-tree-content">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
      <div className="text-secondary small mt-3">Total nodos: {totalNodes}</div>
    </div>
  );
}
