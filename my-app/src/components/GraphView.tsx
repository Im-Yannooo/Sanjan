import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabContext, Note } from '../context/TabContext';

interface GraphNode {
  id: string; // full note title (e.g. Welcome.md)
  label: string; // note title without .md
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphLink {
  source: string;
  target: string;
}

const GraphView: React.FC = () => {
  const { allNotes, openNote } = useTabContext();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Graph state stored in refs for physics engine speed
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);

  // Pan and Zoom
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1.0);

  // Mouse interaction state
  const dragNodeRef = useRef<GraphNode | null>(null);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 }); // transformed to graph space
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Setup dimensions
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Update canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
      setDimensions({
        width: canvas.parentElement.clientWidth,
        height: canvas.parentElement.clientHeight,
      });
    }
    // Initialize pan to center the graph
    setPanX(canvas.parentElement ? canvas.parentElement.clientWidth / 2 : 300);
    setPanY(canvas.parentElement ? canvas.parentElement.clientHeight / 2 : 200);

    return () => resizeObserver.disconnect();
  }, []);

  // Synchronize tabs/notes changes into the graph node coordinates, keeping existing positions
  useEffect(() => {
    const currentNodes = nodesRef.current;
    const noteMap = new Map<string, Note>();
    allNotes.forEach((n) => noteMap.set(n.title, n));

    // 1. Remove deleted nodes
    const nextNodes = currentNodes.filter((n) => noteMap.has(n.id));

    // 2. Add new nodes
    noteMap.forEach((note, title) => {
      if (!nextNodes.some((n) => n.id === title)) {
        const label = title.endsWith('.md') ? title.slice(0, -3) : title;
        nextNodes.push({
          id: title,
          label,
          x: (Math.random() - 0.5) * 150, // Initial coordinate around graph center (0,0)
          y: (Math.random() - 0.5) * 150,
          vx: 0,
          vy: 0,
          radius: title === 'Welcome.md' ? 8 : 6,
        });
      }
    });

    nodesRef.current = nextNodes;

    // 3. Build new links
    const newLinks: GraphLink[] = [];
    allNotes.forEach((note) => {
      // Find all double brackets like [[Link]] or [[Link|Alias]]
      const matches = note.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const match of matches) {
        const fullLinkText = match[1];
        // handle alias [[Note Title|Alias]]
        const targetTitle = fullLinkText.split('|')[0].trim();
        const formattedTarget = targetTitle.endsWith('.md') ? targetTitle : `${targetTitle}.md`;

        // Check if the target note exists in allNotes list
        if (noteMap.has(formattedTarget)) {
          newLinks.push({
            source: note.title,
            target: formattedTarget,
          });
        }
      }
    });

    linksRef.current = newLinks;
  }, [allNotes]);

  // Main animation / Physics Loop
  useEffect(() => {
    let animationId: number;

    const tick = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const dragNode = dragNodeRef.current;

      const repelStrength = 1000;
      const linkDistance = 100;
      const springStrength = 0.04;
      const gravityStrength = 0.015;
      const friction = 0.82;

      // 1. Coulomb Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = repelStrength / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (n1 !== dragNode) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2 !== dragNode) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // Create a map for faster lookup of nodes
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // 2. Hooke Spring Attraction along links
      for (const link of links) {
        const n1 = nodeMap.get(link.source);
        const n2 = nodeMap.get(link.target);
        if (!n1 || !n2) continue;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - linkDistance;
        const force = displacement * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (n1 !== dragNode) {
          n1.vx += fx;
          n1.vy += fy;
        }
        if (n2 !== dragNode) {
          n2.vx -= fx;
          n2.vy -= fy;
        }
      }

      // 3. Central Gravity (attract towards graph center (0,0))
      for (const node of nodes) {
        if (node === dragNode) continue;
        node.vx -= node.x * gravityStrength;
        node.vy -= node.y * gravityStrength;
      }

      // 4. Update Node Positions
      for (const node of nodes) {
        if (node === dragNode) continue;
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= friction;
        node.vy *= friction;
      }

      draw();
      animationId = requestAnimationFrame(tick);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear screen
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      ctx.save();
      // Apply pan and zoom transforms
      ctx.translate(panX, panY);
      ctx.scale(zoomScale, zoomScale);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // 1. Draw Links/Edges
      ctx.strokeStyle = '#b8b0a0';
      ctx.lineWidth = 1.5;

      for (const link of links) {
        const fromNode = nodes.find((n) => n.id === link.source);
        const toNode = nodes.find((n) => n.id === link.target);
        if (!fromNode || !toNode) continue;

        const isHighlighted =
          hoveredNodeId === link.source || hoveredNodeId === link.target;

        ctx.strokeStyle = isHighlighted ? '#5a4633' : 'rgba(184, 176, 160, 0.4)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }

      // 2. Draw Nodes
      for (const node of nodes) {
        const isHovered = hoveredNodeId === node.id;
        const isNeighbor =
          hoveredNodeId !== null &&
          (links.some(
            (l) =>
              (l.source === node.id && l.target === hoveredNodeId) ||
              (l.target === node.id && l.source === hoveredNodeId)
          ) || isHovered);

        // Node Color: Gold/Beige theme colors
        // Active node = brown, Hovered node = dark brown, neighbors = medium brown, regular = light brown
        let nodeColor = '#d7cfbe';
        let strokeColor = '#b8b0a0';
        let strokeWidth = 1.5;
        let radius = node.radius;

        if (isHovered) {
          nodeColor = '#5a4633';
          strokeColor = '#3b332b';
          radius += 2;
        } else if (isNeighbor) {
          nodeColor = '#b8b0a0';
          strokeColor = '#5a4633';
        } else if (node.id === 'Welcome.md') {
          nodeColor = '#a89d84';
          strokeColor = '#5a4633';
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        // 3. Draw Labels (always for all nodes if zoomScale > 0.6, or for hovered/neighbor nodes if zoomed out)
        const showLabel = zoomScale > 0.6 || isHovered || isNeighbor;
        if (showLabel) {
          ctx.fillStyle = isHovered ? '#3b332b' : '#5a4633';
          ctx.font = isHovered
            ? 'bold 11px system-ui, -apple-system, sans-serif'
            : '10px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          // Draw label below node
          ctx.fillText(node.label, node.x, node.y + radius + 4);
        }
      }

      ctx.restore();
    };

    tick();

    return () => cancelAnimationFrame(animationId);
  }, [dimensions, panX, panY, zoomScale, hoveredNodeId]);

  // Translate client coordinate to graph space coordinate
  const getGraphCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - panX) / zoomScale;
    const y = (clientY - rect.top - panY) / zoomScale;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getGraphCoords(e.clientX, e.clientY);

    // Find if clicked on any node
    const clickedNode = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= node.radius + 5; // Jitter buffer
    });

    if (clickedNode) {
      dragNodeRef.current = clickedNode;
      // Anchor velocity
      clickedNode.vx = 0;
      clickedNode.vy = 0;
    } else {
      // Start panning
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getGraphCoords(e.clientX, e.clientY);
    mousePosRef.current = { x, y };

    if (dragNodeRef.current) {
      // Update dragged node position directly
      dragNodeRef.current.x = x;
      dragNodeRef.current.y = y;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      // Pan layout
      setPanX(e.clientX - startPanRef.current.x);
      setPanY(e.clientY - startPanRef.current.y);
    } else {
      // Check for hover
      const hoverNode = nodesRef.current.find((node) => {
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= node.radius + 6;
      });
      setHoveredNodeId(hoverNode ? hoverNode.id : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragNodeRef.current) {
      dragNodeRef.current = null;
    }
    isPanningRef.current = false;
  };

  const handleMouseLeave = () => {
    dragNodeRef.current = null;
    isPanningRef.current = false;
    setHoveredNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const newScale = e.deltaY < 0 ? zoomScale * zoomFactor : zoomScale / zoomFactor;
    const clampedScale = Math.min(Math.max(newScale, 0.2), 4.0);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Adjust pans so zoom is focused on mouse cursor
    setPanX(mouseX - (mouseX - panX) * (clampedScale / zoomScale));
    setPanY(mouseY - (mouseY - panY) * (clampedScale / zoomScale));
    setZoomScale(clampedScale);
  };

  // Opens the note AND navigates back to MainScreen — openNote alone only updates
  // activeTabId in context, it doesn't leave the /graph route, which is why the
  // screen previously appeared to do nothing on double-click.
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getGraphCoords(e.clientX, e.clientY);

    const clickedNode = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= node.radius + 5;
    });

    if (clickedNode) {
      openNote(clickedNode.id);
      navigate('/MainScreen'); // adjust to your actual MainScreen route if it isn't '/'
    }
  };

  const handleBack = () => {
    navigate('/MainScreen'); // adjust to your actual MainScreen route if it isn't '/'
  };

  return (
    <div style={containerStyle}>
      <button onClick={handleBack} style={backButtonStyle} title="Back to notes">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back
      </button>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={canvasStyle}
      />
      <div style={instructionsStyle}>
        💡 <b>Graph View</b>: Drag nodes to rearrange • Double-click node to open note • Scroll to Zoom • Drag background to Pan
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  backgroundColor: '#ece7d7',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
};

const canvasStyle: React.CSSProperties = {
  flex: 1,
  cursor: 'grab',
  outline: 'none',
};

const backButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '16px',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'rgba(215, 207, 190, 0.9)',
  color: '#5a4633',
  border: '1px solid #b8b0a0',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const instructionsStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '12px',
  left: '20px',
  right: '20px',
  backgroundColor: 'rgba(215, 207, 190, 0.85)',
  color: '#5a4633',
  fontSize: '12px',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #b8b0a0',
  pointerEvents: 'none',
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

export default GraphView;