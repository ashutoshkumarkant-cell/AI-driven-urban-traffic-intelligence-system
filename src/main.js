import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. GENERAL INTERFACE UTILITIES (SCROLL, REVEAL)
  // ==========================================
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Reveal sections on scroll
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });
  
  revealElements.forEach(el => revealObserver.observe(el));

  // Active navigation links on scroll
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ==========================================
  // 2. INTERACTIVE NEURAL BACKGROUND CANVAS
  // ==========================================
  const bgCanvas = document.getElementById('neural-bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  let width = (bgCanvas.width = window.innerWidth);
  let height = (bgCanvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = (bgCanvas.width = window.innerWidth);
    height = (bgCanvas.height = window.innerHeight);
  });

  const particles = [];
  const particleCount = Math.min(60, Math.floor(width / 25));
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
    });
  }

  function drawBgParticles() {
    bgCtx.clearRect(0, 0, width, height);
    bgCtx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    bgCtx.strokeStyle = 'rgba(157, 78, 221, 0.05)';
    bgCtx.lineWidth = 1;

    // Update & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      bgCtx.fill();

      // Connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 150) {
          bgCtx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 150)})`;
          bgCtx.beginPath();
          bgCtx.moveTo(p.x, p.y);
          bgCtx.lineTo(p2.x, p2.y);
          bgCtx.stroke();
        }
      }
    }
  }

  // ==========================================
  // 3. HERO CORRIDOR NODE-FLOW VISUALIZER
  // ==========================================
  const heroCanvas = document.getElementById('hero-canvas');
  const heroCtx = heroCanvas.getContext('2d');
  
  // Set size
  function resizeHeroCanvas() {
    const parent = heroCanvas.parentElement;
    heroCanvas.width = parent.clientWidth;
    heroCanvas.height = parent.clientWidth; // Keep 1:1 aspect ratio
  }
  resizeHeroCanvas();
  window.addEventListener('resize', resizeHeroCanvas);

  // Generate intersection graph
  const nodes = [];
  const edges = [];
  const nodeCount = 12;
  
  // Generate random stable coordinates in concentric rings
  for (let i = 0; i < nodeCount; i++) {
    let x, y;
    if (i === 0) {
      x = 0.5; y = 0.5; // Center node
    } else {
      const angle = ((i - 1) / (nodeCount - 1)) * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.15;
      x = 0.5 + Math.cos(angle) * radius;
      y = 0.5 + Math.sin(angle) * radius;
    }
    nodes.push({
      x, y,
      id: i,
      pulse: 0,
      active: false,
      name: `Intersection-${String.fromCharCode(65 + i)}`,
      speed: 30 + Math.random() * 30
    });
  }

  // Generate edge roads
  for (let i = 0; i < nodes.length; i++) {
    // Connect each to two nearest
    const distances = nodes
      .map((n, idx) => ({ idx, dist: Math.hypot(nodes[i].x - n.x, nodes[i].y - n.y) }))
      .filter(d => d.idx !== i)
      .sort((a, b) => a.dist - b.dist);
      
    // Connect to closest 2 neighbors
    for (let k = 0; k < Math.min(2, distances.length); k++) {
      const target = distances[k].idx;
      // Avoid duplicate edges
      if (!edges.some(e => (e.source === i && e.target === target) || (e.source === target && e.target === i))) {
        edges.push({
          source: i,
          target,
          weight: Math.random() * 0.8 + 0.2, // Congestion index
          cars: []
        });
      }
    }
  }

  // Spawn cars on edges
  edges.forEach(edge => {
    const numCars = Math.floor(Math.random() * 3) + 1;
    for (let c = 0; c < numCars; c++) {
      edge.cars.push({
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        color: Math.random() > 0.3 ? '#00f0ff' : '#9d4edd'
      });
    }
  });

  // Track hover coordinate
  let mouse = { x: -1000, y: -1000, hoverNode: null };
  heroCanvas.addEventListener('mousemove', (e) => {
    const rect = heroCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouse.x = mx;
    mouse.y = my;
    
    // Find closest node
    mouse.hoverNode = null;
    nodes.forEach(node => {
      const nx = node.x * heroCanvas.width;
      const ny = node.y * heroCanvas.height;
      if (Math.hypot(nx - mx, ny - my) < 18) {
        mouse.hoverNode = node;
      }
    });
  });

  // Trigger click pulses
  heroCanvas.addEventListener('click', () => {
    if (mouse.hoverNode) {
      mouse.hoverNode.pulse = 1.0;
      mouse.hoverNode.active = true;
      // Trigger cascading pulses to edges
      edges.forEach(edge => {
        if (edge.source === mouse.hoverNode.id || edge.target === mouse.hoverNode.id) {
          // Send extra glowing packets
          edge.cars.push({
            progress: edge.source === mouse.hoverNode.id ? 0 : 1,
            direction: edge.source === mouse.hoverNode.id ? 1 : -1,
            speed: 0.02,
            specialGlow: true,
            color: '#00f0ff'
          });
        }
      });
      setTimeout(() => {
        if (mouse.hoverNode) mouse.hoverNode.active = false;
      }, 500);
    }
  });

  function drawHeroNetwork() {
    const w = heroCanvas.width;
    const h = heroCanvas.height;
    heroCtx.clearRect(0, 0, w, h);

    // Draw edges (roads)
    edges.forEach(edge => {
      const s = nodes[edge.source];
      const t = nodes[edge.target];
      const sx = s.x * w;
      const sy = s.y * h;
      const tx = t.x * w;
      const ty = t.y * h;

      // Color base on congestion weight
      const isRed = edge.weight > 0.7;
      heroCtx.strokeStyle = isRed ? 'rgba(255, 82, 82, 0.25)' : 'rgba(255, 255, 255, 0.08)';
      heroCtx.lineWidth = isRed ? 3 : 2;
      heroCtx.beginPath();
      heroCtx.moveTo(sx, sy);
      heroCtx.lineTo(tx, ty);
      heroCtx.stroke();

      // Draw cars on links
      edge.cars.forEach((car, index) => {
        if (car.direction === -1) {
          car.progress -= car.speed;
          if (car.progress <= 0) car.progress = 1;
        } else {
          car.progress += car.speed;
          if (car.progress >= 1) car.progress = 0;
        }

        const cx = sx + (tx - sx) * car.progress;
        const cy = sy + (ty - sy) * car.progress;

        heroCtx.fillStyle = car.color;
        if (car.specialGlow) {
          heroCtx.shadowColor = car.color;
          heroCtx.shadowBlur = 10;
          heroCtx.beginPath();
          heroCtx.arc(cx, cy, 5, 0, Math.PI * 2);
          heroCtx.fill();
          heroCtx.shadowBlur = 0; // reset
          
          // Remove custom glow packets when done
          if (car.progress >= 0.98 || car.progress <= 0.02) {
            edge.cars.splice(index, 1);
          }
        } else {
          heroCtx.beginPath();
          heroCtx.arc(cx, cy, 3, 0, Math.PI * 2);
          heroCtx.fill();
        }
      });
    });

    // Draw nodes (intersections)
    nodes.forEach(node => {
      const nx = node.x * w;
      const ny = node.y * h;

      // Draw pulse glow
      if (node.pulse > 0.01) {
        heroCtx.strokeStyle = `rgba(0, 240, 255, ${node.pulse})`;
        heroCtx.lineWidth = 2;
        heroCtx.beginPath();
        heroCtx.arc(nx, ny, 15 + (1 - node.pulse) * 20, 0, Math.PI * 2);
        heroCtx.stroke();
        node.pulse -= 0.02;
      }

      // Hover status
      const isHovered = mouse.hoverNode === node;
      heroCtx.fillStyle = isHovered ? '#00f0ff' : (node.active ? '#9d4edd' : '#080a12');
      heroCtx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      heroCtx.lineWidth = isHovered ? 3 : 1.5;

      heroCtx.beginPath();
      heroCtx.arc(nx, ny, isHovered ? 10 : 7, 0, Math.PI * 2);
      heroCtx.fill();
      heroCtx.stroke();

      // Glowing core if hovered
      if (isHovered) {
        heroCtx.shadowColor = '#00f0ff';
        heroCtx.shadowBlur = 10;
        heroCtx.fillStyle = '#ffffff';
        heroCtx.beginPath();
        heroCtx.arc(nx, ny, 4, 0, Math.PI * 2);
        heroCtx.fill();
        heroCtx.shadowBlur = 0; // reset
      }
    });

    // Draw Info Overlay if hovered
    if (mouse.hoverNode) {
      const n = mouse.hoverNode;
      const nx = n.x * w;
      const ny = n.y * h;
      
      heroCtx.fillStyle = 'rgba(5, 7, 13, 0.9)';
      heroCtx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      heroCtx.lineWidth = 1;
      
      const boxW = 160;
      const boxH = 65;
      const bx = Math.min(w - boxW - 10, Math.max(10, nx - boxW / 2));
      const by = Math.max(10, ny - boxH - 15);
      
      heroCtx.beginPath();
      heroCtx.roundRect(bx, by, boxW, boxH, 8);
      heroCtx.fill();
      heroCtx.stroke();
      
      heroCtx.font = 'bold 11px sans-serif';
      heroCtx.fillStyle = '#ffffff';
      heroCtx.fillText(n.name, bx + 10, by + 18);
      
      heroCtx.font = '10px monospace';
      heroCtx.fillStyle = '#94a3b8';
      heroCtx.fillText(`Latency: 0.24ms`, bx + 10, by + 34);
      heroCtx.fillText(`Flow: ${Math.floor(n.speed)} vehicles/m`, bx + 10, by + 48);
    }
  }

  // ==========================================
  // 4. SPATIO-TEMPORAL GNN VISUALIZER
  // ==========================================
  const gnnCanvas = document.getElementById('gnn-canvas');
  const gnnCtx = gnnCanvas.getContext('2d');
  
  function resizeGnnCanvas() {
    const parent = gnnCanvas.parentElement;
    gnnCanvas.width = parent.clientWidth;
    gnnCanvas.height = parent.clientHeight || 280;
  }
  resizeGnnCanvas();
  window.addEventListener('resize', resizeGnnCanvas);

  const gnnNodes = [];
  const gnnEdges = [];
  
  // Arrange in circular hierarchy layers
  const rings = [4, 8, 12];
  let nodeCounter = 0;
  rings.forEach((count, ringIdx) => {
    const radius = 40 + ringIdx * 45;
    for (let c = 0; c < count; c++) {
      const angle = (c / count) * Math.PI * 2 + (ringIdx * 0.2);
      gnnNodes.push({
        id: nodeCounter++,
        ring: ringIdx,
        angle,
        radius,
        pulseOffset: Math.random() * Math.PI * 2,
        hotspot: ringIdx === 2 && c % 3 === 0, // Predict outer congestion hotspots
        optimized: false
      });
    }
  });

  // Create connections
  gnnNodes.forEach(node => {
    gnnNodes.forEach(other => {
      if (node.id === other.id) return;
      
      const radialDist = Math.abs(node.radius - other.radius);
      const angleDist = Math.abs(node.angle - other.angle);
      
      // Connect adjacent rings or nodes on same ring close to each other
      if (radialDist < 50 && angleDist < 0.6) {
        if (!gnnEdges.some(e => (e.source === node.id && e.target === other.id) || (e.source === other.id && e.target === node.id))) {
          gnnEdges.push({ source: node.id, target: other.id, weight: Math.random() });
        }
      }
    });
  });

  let gnnFrame = 0;
  function drawGnnSimulation() {
    gnnFrame += 0.02;
    const w = gnnCanvas.width;
    const h = gnnCanvas.height;
    gnnCtx.clearRect(0, 0, w, h);
    
    const cx = w / 2;
    const cy = h / 2;
    
    // Draw GNN communication links (edges)
    gnnEdges.forEach(edge => {
      const s = gnnNodes[edge.source];
      const t = gnnNodes[edge.target];
      
      const sx = cx + Math.cos(s.angle) * s.radius;
      const sy = cy + Math.sin(s.angle) * s.radius;
      const tx = cx + Math.cos(t.angle) * t.radius;
      const ty = cy + Math.sin(t.angle) * t.radius;
      
      // Animate flowing pulses along weights
      const flow = (Math.sin(gnnFrame * 2 + edge.weight * 5) + 1) / 2;
      
      gnnCtx.strokeStyle = `rgba(157, 78, 221, ${0.07 + flow * 0.15})`;
      gnnCtx.lineWidth = 1;
      gnnCtx.beginPath();
      gnnCtx.moveTo(sx, sy);
      gnnCtx.lineTo(tx, ty);
      gnnCtx.stroke();
      
      // Dot travel pulse
      const dotX = sx + (tx - sx) * flow;
      const dotY = sy + (ty - sy) * flow;
      gnnCtx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      gnnCtx.beginPath();
      gnnCtx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
      gnnCtx.fill();
    });

    // Draw GNN intersections (nodes)
    gnnNodes.forEach(node => {
      const nx = cx + Math.cos(node.angle) * node.radius;
      const ny = cy + Math.sin(node.angle) * node.radius;
      
      const sizeOffset = Math.sin(gnnFrame * 3 + node.pulseOffset) * 2;
      
      if (node.hotspot) {
        // Red Hotspot alert
        const isOptimizing = (Math.sin(gnnFrame) > 0);
        gnnCtx.fillStyle = isOptimizing ? '#00e676' : '#ff5252';
        gnnCtx.shadowColor = isOptimizing ? '#00e676' : '#ff5252';
        gnnCtx.shadowBlur = 8 + sizeOffset * 2;
        gnnCtx.beginPath();
        gnnCtx.arc(nx, ny, 6 + sizeOffset * 0.5, 0, Math.PI * 2);
        gnnCtx.fill();
        gnnCtx.shadowBlur = 0; // reset
        
        // Label
        gnnCtx.font = '8px monospace';
        gnnCtx.fillStyle = isOptimizing ? '#00e676' : '#ff5252';
        gnnCtx.fillText(isOptimizing ? 'RESOLVED' : 'HOTSPOT', nx + 8, ny + 3);
      } else {
        // Normal node
        gnnCtx.fillStyle = 'rgba(0, 240, 255, 0.6)';
        gnnCtx.beginPath();
        gnnCtx.arc(nx, ny, 4 + sizeOffset * 0.3, 0, Math.PI * 2);
        gnnCtx.fill();
      }
    });
  }

  // ==========================================
  // 5. RL INTERSECTION SIGNAL CONTROL VISUALIZER
  // ==========================================
  const rlCanvas = document.getElementById('rl-signals-canvas');
  const rlCtx = rlCanvas.getContext('2d');

  function resizeRlCanvas() {
    const parent = rlCanvas.parentElement;
    rlCanvas.width = parent.clientWidth;
    rlCanvas.height = parent.clientHeight || 280;
  }
  resizeRlCanvas();
  window.addEventListener('resize', resizeRlCanvas);

  let rlFrame = 0;
  let signalPhase = 0; // 0: N/S Green, 1: E/W Green
  let signalTimer = 0;
  const queues = { north: 3, south: 4, east: 1, west: 0 };
  let optimizationMode = true; // Simulating RL

  function drawRlSimulation() {
    rlFrame += 0.5;
    signalTimer++;
    
    // Periodically adjust signals based on queue length (RL optimization demo)
    if (signalTimer > 180) {
      signalTimer = 0;
      // Calculate where there is higher congestion
      const nsSum = queues.north + queues.south;
      const ewSum = queues.east + queues.west;
      
      if (nsSum > ewSum) {
        signalPhase = 0; // N/S Green
      } else if (ewSum > nsSum) {
        signalPhase = 1; // E/W Green
      } else {
        signalPhase = 1 - signalPhase; // Toggle
      }
    }

    // Add cars dynamically to queues
    if (Math.random() < 0.015) queues.north = Math.min(10, queues.north + 1);
    if (Math.random() < 0.012) queues.south = Math.min(10, queues.south + 1);
    if (Math.random() < 0.008) queues.east = Math.min(10, queues.east + 1);
    if (Math.random() < 0.007) queues.west = Math.min(10, queues.west + 1);

    // Drain queues depending on green light
    if (rlFrame % 25 === 0) {
      if (signalPhase === 0) {
        if (queues.north > 0) queues.north--;
        if (queues.south > 0) queues.south--;
      } else {
        if (queues.east > 0) queues.east--;
        if (queues.west > 0) queues.west--;
      }
    }

    const w = rlCanvas.width;
    const h = rlCanvas.height;
    rlCtx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const roadWidth = 70;

    // Draw Roads (Crossroad grid)
    rlCtx.fillStyle = '#0a0d17';
    // Vertical road
    rlCtx.fillRect(cx - roadWidth / 2, 0, roadWidth, h);
    // Horizontal road
    rlCtx.fillRect(0, cy - roadWidth / 2, w, roadWidth);

    // Road dashes
    rlCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    rlCtx.lineWidth = 2;
    rlCtx.setLineDash([8, 12]);
    // N/S dashed line
    rlCtx.beginPath();
    rlCtx.moveTo(cx, 0);
    rlCtx.lineTo(cx, cy - roadWidth / 2);
    rlCtx.moveTo(cx, cy + roadWidth / 2);
    rlCtx.lineTo(cx, h);
    // E/W dashed line
    rlCtx.moveTo(0, cy);
    rlCtx.lineTo(cx - roadWidth / 2, cy);
    rlCtx.moveTo(cx + roadWidth / 2, cy);
    rlCtx.lineTo(w, cy);
    rlCtx.stroke();
    rlCtx.setLineDash([]); // Reset

    // Stop lines
    rlCtx.strokeStyle = 'rgba(255,255,255,0.4)';
    rlCtx.lineWidth = 3;
    // North lane stop
    rlCtx.beginPath();
    rlCtx.moveTo(cx - roadWidth / 2, cy - roadWidth / 2);
    rlCtx.lineTo(cx, cy - roadWidth / 2);
    // South lane stop
    rlCtx.moveTo(cx, cy + roadWidth / 2);
    rlCtx.lineTo(cx + roadWidth / 2, cy + roadWidth / 2);
    // East lane stop
    rlCtx.moveTo(cx + roadWidth / 2, cy - roadWidth / 2);
    rlCtx.lineTo(cx + roadWidth / 2, cy);
    // West lane stop
    rlCtx.moveTo(cx - roadWidth / 2, cy);
    rlCtx.lineTo(cx - roadWidth / 2, cy + roadWidth / 2);
    rlCtx.stroke();

    // Draw Traffic Lights
    const lightOffset = 45;
    const colors = { red: '#ff5252', green: '#00e676' };

    // N/S Light
    const nsColor = signalPhase === 0 ? colors.green : colors.red;
    rlCtx.fillStyle = nsColor;
    rlCtx.shadowColor = nsColor;
    rlCtx.shadowBlur = 6;
    rlCtx.beginPath();
    rlCtx.arc(cx - lightOffset, cy - lightOffset, 6, 0, Math.PI * 2);
    rlCtx.arc(cx + lightOffset, cy + lightOffset, 6, 0, Math.PI * 2);
    rlCtx.fill();

    // E/W Light
    const ewColor = signalPhase === 1 ? colors.green : colors.red;
    rlCtx.fillStyle = ewColor;
    rlCtx.shadowColor = ewColor;
    rlCtx.beginPath();
    rlCtx.arc(cx + lightOffset, cy - lightOffset, 6, 0, Math.PI * 2);
    rlCtx.arc(cx - lightOffset, cy + lightOffset, 6, 0, Math.PI * 2);
    rlCtx.fill();
    rlCtx.shadowBlur = 0; // Reset

    // Draw Queued Cars
    rlCtx.fillStyle = '#9d4edd';
    // North Queue (going south, right side of dashed line)
    for (let i = 0; i < queues.north; i++) {
      rlCtx.fillRect(cx - 24, cy - roadWidth / 2 - 15 - (i * 14), 10, 8);
    }
    // South Queue (going north, right side of dashed line)
    rlCtx.fillStyle = '#00f0ff';
    for (let i = 0; i < queues.south; i++) {
      rlCtx.fillRect(cx + 14, cy + roadWidth / 2 + 8 + (i * 14), 10, 8);
    }
    // East Queue (going west, right side of dashed line)
    rlCtx.fillStyle = '#ffb703';
    for (let i = 0; i < queues.east; i++) {
      rlCtx.fillRect(cx + roadWidth / 2 + 8 + (i * 14), cy - 24, 8, 10);
    }
    // West Queue (going east, right side of dashed line)
    rlCtx.fillStyle = '#00e676';
    for (let i = 0; i < queues.west; i++) {
      rlCtx.fillRect(cx - roadWidth / 2 - 15 - (i * 14), cy + 14, 8, 10);
    }

    // Overlay stats
    rlCtx.fillStyle = 'rgba(5, 7, 13, 0.8)';
    rlCtx.strokeStyle = 'rgba(0,240,255,0.3)';
    rlCtx.lineWidth = 1;
    rlCtx.beginPath();
    rlCtx.roundRect(10, 10, 140, 50, 6);
    rlCtx.fill();
    rlCtx.stroke();

    rlCtx.font = '10px monospace';
    rlCtx.fillStyle = '#94a3b8';
    rlCtx.fillText(`Signal Control: AI`, 15, 25);
    rlCtx.fillStyle = '#00e676';
    rlCtx.fillText(`Reward: +${(10 - (queues.north + queues.south + queues.east + queues.west) * 0.4).toFixed(1)}`, 15, 38);
    rlCtx.fillStyle = '#00f0ff';
    rlCtx.fillText(`Sync Efficiency: 96%`, 15, 50);
  }

  // ==========================================
  // 6. TRAFFIC DIGITAL TWIN SIMULATION SANDBOX
  // ==========================================
  const twinCanvas = document.getElementById('twin-sandbox-canvas');
  const twinCtx = twinCanvas.getContext('2d');

  function resizeTwinCanvas() {
    const parent = twinCanvas.parentElement;
    const rect = parent.getBoundingClientRect();
    twinCanvas.width = rect.width;
    twinCanvas.height = rect.height > 0 ? rect.height : (rect.width / 1.6);
  }
  resizeTwinCanvas();
  window.addEventListener('resize', resizeTwinCanvas);

  // Digital Twin parameters
  let trafficDemand = 2; // 1: Low, 2: Moderate, 3: High
  let weatherProfile = 'clear'; // clear, rain, fog, heatwave
  let isIncidentActive = false;
  let isProactiveOptimization = false;
  
  // NEW FEATURES STATE
  let activeWeather = 'clear';
  let activeEvent = 'none';
  let isEmsCorridorActive = false;
  let emsEta = 11;
  let emsProgress = 0; // 0 to 1 for corridor transit
  let citizenReportMode = null; // 'accident', 'pothole', 'closure', 'waterlogging'
  const citizenPins = []; // custom markers
  let selectedJunction = null; // Smart Junction Explorer active junction
  let predictionsCounter = 12846;
  
  // Incident visual overlays (Accident, Breakdown, Blockage)
  const activeIncidents = {
    accident: false,
    breakdown: false,
    blockage: false
  };
  
  // UI Hook listeners
  const demandSlider = document.getElementById('demand-slider');
  const demandValText = document.getElementById('demand-val');
  const weatherBtns = document.querySelectorAll('.weather-btn');
  const incidentBtn = document.getElementById('incident-btn');
  const optToggleBtn = document.getElementById('opt-toggle-btn');
  
  // Stats inside simulation to update
  const statCongestionText = document.getElementById('stat-congestion');
  const statDelayText = document.getElementById('stat-delay');
  const statCo2Text = document.getElementById('stat-co2');
  const statEmsText = document.getElementById('stat-ems');
  
  // Dashboard indicators to sync with sandbox
  const dashSpeedVal = document.getElementById('dash-val-speed');
  const dashSpeedTrend = document.getElementById('dash-trend-speed');
  const dashAccStatus = document.getElementById('acc-status-badge');

  demandSlider.addEventListener('input', (e) => {
    trafficDemand = parseInt(e.target.value);
    const labels = { 1: 'Off-Peak (Fluid)', 2: 'Moderate (Standard)', 3: 'Rush Hour (Critical)' };
    demandValText.textContent = labels[trafficDemand];
    
    // Spawn more/fewer cars depending on demand
    syncSimulationDensity();
    addSimLog(`Congestion Influx demand set to level: ${trafficDemand}`);
  });

  // Expanded weather click logic including impacts
  weatherBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      weatherBtns.forEach(b => b.classList.remove('active'));
      const weather = btn.getAttribute('data-weather');
      weatherProfile = weather;
      activeWeather = weather;
      btn.classList.add('active');
      addSimLog(`Weather state updated to: ${weather.toUpperCase()}`);
      
      // Update weather impact prediction metrics dynamically
      const impactCong = document.getElementById('weather-impact-congestion');
      const impactAcc = document.getElementById('weather-impact-accident');
      const impactSpeed = document.getElementById('weather-impact-speed');
      
      if (weather === 'clear') {
        impactCong.textContent = '+0%';
        impactAcc.textContent = '12%';
        impactSpeed.textContent = '-0%';
      } else if (weather === 'rain') {
        impactCong.textContent = '+18%';
        impactAcc.textContent = '54%';
        impactSpeed.textContent = '-20%';
      } else if (weather === 'fog') {
        impactCong.textContent = '+32%';
        impactAcc.textContent = '78%';
        impactSpeed.textContent = '-40%';
      } else if (weather === 'heatwave') {
        impactCong.textContent = '+10%';
        impactAcc.textContent = '28%';
        impactSpeed.textContent = '-10%';
      }
    });
  });

  // Event simulator selector handling
  const eventSelector = document.getElementById('event-selector');
  const eventImpactPanel = document.getElementById('event-impact-panel');
  const eventVehicles = document.getElementById('event-stat-vehicles');
  const eventZones = document.getElementById('event-stat-zones');
  const eventParking = document.getElementById('event-stat-parking');
  const eventDiversion = document.getElementById('event-stat-diversion');

  eventSelector.addEventListener('change', (e) => {
    const val = e.target.value;
    activeEvent = val;
    if (val === 'none') {
      eventImpactPanel.style.display = 'none';
      addSimLog(`Event traffic models disengaged. Grid resuming standard flow.`);
    } else {
      eventImpactPanel.style.display = 'block';
      let vText = '+0', zText = 'None', pText = 'Moderate', dText = 'None';
      if (val === 'ipl') {
        vText = '+3,200'; zText = 'Sector 4, Main Rd'; pText = '96% (CRITICAL)'; dText = 'West Ring bypass';
      } else if (val === 'concert') {
        vText = '+1,800'; zText = 'Broadway Link'; pText = '88% (HIGH)'; dText = 'Reroute via Sector 3';
      } else if (val === 'rally') {
        vText = '+2,500'; zText = 'MG Road, Plaza Crossing'; pText = '75% (MODERATE)'; dText = 'Avoid central square';
      } else if (val === 'fest') {
        vText = '+950'; zText = 'University Ave'; pText = '82% (HIGH)'; dText = 'Transit corridor wave';
      }
      eventVehicles.textContent = vText;
      eventZones.textContent = zText;
      eventParking.textContent = pText;
      eventDiversion.textContent = dText;
      
      addSimLog(`EVENT SIMULATION LOADED: ${val.toUpperCase()} model engaged.`, 'system');
      addSimLog(`GNN anticipated +${vText} traffic propagation near ${zText}.`, 'warn');
    }
  });

  // Emergency Green Corridor control
  const emsBtn = document.getElementById('ems-corridor-btn');
  const emsStatsPanel = document.getElementById('ems-stats-panel');
  const emsNormalEtaText = document.getElementById('ems-normal-eta');
  const emsOptimizedEtaText = document.getElementById('ems-optimized-eta');
  const emsTimeSavedText = document.getElementById('ems-time-saved');

  emsBtn.addEventListener('click', () => {
    isEmsCorridorActive = !isEmsCorridorActive;
    if (isEmsCorridorActive) {
      emsBtn.classList.add('active');
      emsBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> AI Corridor: ACTIVE`;
      emsStatsPanel.style.display = 'block';
      emsEta = 11;
      emsProgress = 0;
      addSimLog(`EMERGENCY: Ambulance dispatch request from EMS-09 to Trauma Care.`, 'error');
      addSimLog(`AI GREEN CORRIDOR ENGAGED. Overriding signals at Junctions 0, 1, 2, 5, 8.`, 'system');
    } else {
      emsBtn.classList.remove('active');
      emsBtn.innerHTML = `<i class="fa-solid fa-truck-medical"></i> Activate Green Corridor`;
      emsStatsPanel.style.display = 'none';
      addSimLog(`AI Green Corridor disengaged. Reverting grid to standard adaptive model.`, 'normal');
    }
  });

  // Citizen Reporting button listeners
  const reportBtns = document.querySelectorAll('.report-btn');
  const reportingIndicator = document.getElementById('reporting-active-indicator');
  const reportingLabel = document.getElementById('reporting-type-label');

  reportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-report');
      if (citizenReportMode === type) {
        // Toggle off
        citizenReportMode = null;
        btn.classList.remove('active');
        reportingIndicator.style.display = 'none';
      } else {
        reportBtns.forEach(b => b.classList.remove('active'));
        citizenReportMode = type;
        btn.classList.add('active');
        reportingLabel.textContent = type.toUpperCase();
        reportingIndicator.style.display = 'flex';
        addSimLog(`Citizen reporting tool active: Click on twin map to report a ${type}.`);
      }
    });
  });

  // Timeline step selector
  const timelineBtns = document.querySelectorAll('.timeline-step-btn');
  timelineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timelineBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const hour = btn.getAttribute('data-hour');
      addSimLog(`SIMULATOR TIME WARP: Simulating grid flows at ${hour}:00 hours.`, 'system');
      
      // Map hours to demand sliders
      if (hour === '6') {
        demandSlider.value = 1;
        trafficDemand = 1;
        demandValText.textContent = 'Off-Peak (Fluid)';
      } else if (hour === '8') {
        demandSlider.value = 2;
        trafficDemand = 2;
        demandValText.textContent = 'Moderate (Standard)';
      } else if (hour === '9') {
        demandSlider.value = 3;
        trafficDemand = 3;
        demandValText.textContent = 'Rush Hour (Critical)';
      } else if (hour === '11') {
        demandSlider.value = 1;
        trafficDemand = 1;
        demandValText.textContent = 'Off-Peak (Fluid)';
      } else if (hour === '17') {
        demandSlider.value = 3;
        trafficDemand = 3;
        demandValText.textContent = 'Rush Hour (Critical)';
      }
      syncSimulationDensity();
    });
  });

  incidentBtn.addEventListener('click', () => {
    isIncidentActive = !isIncidentActive;
    if (isIncidentActive) {
      incidentBtn.classList.add('active');
      incidentBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Incident Active (Roadblock)`;
      dashAccStatus.textContent = 'ROADBLOCK ACTIVE';
      dashAccStatus.classList.remove('active');
      dashAccStatus.classList.add('error');
      addSimLog(`ALERT: Multi-vehicle crash reported on Corridor 4 Broadway.`, 'error');
    } else {
      incidentBtn.classList.remove('active');
      incidentBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Trigger Crash / Roadblock`;
      dashAccStatus.textContent = 'STANDBY';
      dashAccStatus.classList.remove('error');
      dashAccStatus.classList.add('active');
      addSimLog(`CORRECTION: Obstacle cleared from Corridor 4. Resuming flow.`, 'system');
    }
  });

  optToggleBtn.addEventListener('click', () => {
    isProactiveOptimization = !isProactiveOptimization;
    if (isProactiveOptimization) {
      optToggleBtn.classList.add('active');
      optToggleBtn.innerHTML = `<i class="fa-solid fa-toggle-on"></i> AI Optimization: ON`;
      addSimLog(`AI-OPTIMIZATION CORE ENGAGED. Deploying spatio-temporal predictions...`, 'system');
      
      // Rapid recovery update
      setTimeout(() => {
        addSimLog(`GNN predicting delay propagation. Dynamic routing sent to navigators.`, 'system');
      }, 800);
    } else {
      optToggleBtn.classList.remove('active');
      optToggleBtn.innerHTML = `<i class="fa-solid fa-toggle-off"></i> AI Optimization: OFF`;
      addSimLog(`AI-OPTIMIZATION DISENGAGED. Reverting to static pre-timed signals.`, 'warn');
    }
  });

  // Construct a grid-based sandbox simulation
  const twinIntersections = [];
  const twinRoads = [];
  const simulatedCars = [];

  // Generate 3x3 Grid
  const rows = 3;
  const cols = 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      twinIntersections.push({
        id: r * cols + c,
        r, c,
        pulseGlow: 0,
        lightColor: 'green',
        lightTimer: Math.random() * 100
      });
    }
  }

  // Create links between adjacents
  twinIntersections.forEach(inter => {
    // Connect to Right
    if (inter.c < cols - 1) {
      twinRoads.push({
        source: inter.id,
        target: inter.id + 1,
        dir: 'horizontal',
        congested: false,
        weight: 1
      });
    }
    // Connect to Down
    if (inter.r < rows - 1) {
      twinRoads.push({
        source: inter.id,
        target: inter.id + cols,
        dir: 'vertical',
        congested: false,
        weight: 1
      });
    }
  });

  // Spawn cars
  function syncSimulationDensity() {
    simulatedCars.length = 0; // Clear
    const baseCount = trafficDemand * 25;
    for (let i = 0; i < baseCount; i++) {
      const road = twinRoads[Math.floor(Math.random() * twinRoads.length)];
      const direction = Math.random() > 0.5 ? 1 : -1;
      simulatedCars.push({
        road,
        progress: Math.random(),
        vx: 0.002 + Math.random() * 0.003,
        direction,
        color: '#00f0ff',
        isEmergency: i === 0 // Make first car EMS
      });
    }
  }
  syncSimulationDensity();

  let twinFrame = 0;
  function runTwinSimulation() {
    twinFrame++;
    const w = twinCanvas.width;
    const h = twinCanvas.height;
    twinCtx.clearRect(0, 0, w, h);

    // Padding for margin
    const padX = w * 0.12;
    const padY = h * 0.12;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;

    function getCoords(id) {
      const inter = twinIntersections[id];
      return {
        x: padX + (inter.c / (cols - 1)) * usableW,
        y: padY + (inter.r / (rows - 1)) * usableH
      };
    }

    // Draw weather overlay (rain, fog, heatwave effects)
    if (weatherProfile === 'rain') {
      twinCtx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      twinCtx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const rx = (twinFrame * 5 + i * 80) % w;
        const ry = (twinFrame * 12 + i * 110) % h;
        twinCtx.beginPath();
        twinCtx.moveTo(rx, ry);
        twinCtx.lineTo(rx - 3, ry + 15);
        twinCtx.stroke();
      }
    } else if (weatherProfile === 'fog') {
      // Mist/fog overlay
      const mistGrad = twinCtx.createLinearGradient(0, 0, 0, h);
      mistGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      mistGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
      twinCtx.fillStyle = mistGrad;
      twinCtx.fillRect(0, 0, w, h);
      
      // Drifting mist clouds
      twinCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 3; i++) {
        const mx = (twinFrame * 0.5 + i * 200) % (w + 100) - 50;
        const my = h * (0.2 + i * 0.3);
        twinCtx.beginPath();
        twinCtx.arc(mx, my, 40, 0, Math.PI * 2);
        twinCtx.arc(mx + 30, my - 10, 30, 0, Math.PI * 2);
        twinCtx.fill();
      }
    } else if (weatherProfile === 'heatwave') {
      // Warm shimmer tint
      twinCtx.fillStyle = 'rgba(255, 171, 0, 0.03)';
      twinCtx.fillRect(0, 0, w, h);
      
      // Shimmer lines
      twinCtx.strokeStyle = 'rgba(255, 171, 0, 0.05)';
      twinCtx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const sx = i * (w / 5) + Math.sin(twinFrame * 0.05 + i) * 10;
        twinCtx.beginPath();
        twinCtx.moveTo(sx, h);
        twinCtx.bezierCurveTo(sx + 5, h - 50, sx - 5, h - 100, sx, 0);
        twinCtx.stroke();
      }
    }

    // Dynamic metrics calculation depending on inputs
    // Count active incidents
    const activeIncidentCount = ((isIncidentActive || activeIncidents.accident) ? 1 : 0) + 
                                (activeIncidents.breakdown ? 1 : 0) + 
                                (activeIncidents.blockage ? 1 : 0);

    let speedStat = 38; 
    let congestionPercent = 28;
    let co2Val = 1482;
    let emsVal = 42;

    // Traffic demand levels
    if (trafficDemand === 1) { // Low
      speedStat += 8;
      congestionPercent -= 12;
    } else if (trafficDemand === 3) { // High
      speedStat -= 14;
      congestionPercent += 25;
    }

    // Weather impact adjustments
    if (weatherProfile === 'rain') {
      speedStat -= 6;
      congestionPercent += 8;
    } else if (weatherProfile === 'fog') {
      speedStat -= 12;
      congestionPercent += 16;
    } else if (weatherProfile === 'heatwave') {
      speedStat -= 4;
      congestionPercent += 6;
    }

    // Event impact adjustments
    if (activeEvent === 'ipl') {
      speedStat -= 11;
      congestionPercent += 22;
    } else if (activeEvent === 'concert') {
      speedStat -= 6;
      congestionPercent += 12;
    } else if (activeEvent === 'rally') {
      speedStat -= 9;
      congestionPercent += 16;
    } else if (activeEvent === 'fest') {
      speedStat -= 4;
      congestionPercent += 8;
    }

    // Incident delays
    speedStat -= activeIncidentCount * 6;
    congestionPercent += activeIncidentCount * 12;

    // AI optimizations
    if (isProactiveOptimization) {
      speedStat += 11;
      congestionPercent -= 16;
      co2Val += Math.floor(Math.sin(twinFrame * 0.05) * 5) + 12;
    }

    // Keep statistics looking alive but within range
    congestionPercent = Math.max(8, Math.min(95, congestionPercent + Math.sin(twinFrame * 0.02) * 1.5));
    speedStat = Math.max(10, Math.min(65, speedStat + Math.cos(twinFrame * 0.02) * 0.8));
    
    // Update metric tags in DOM
    statCongestionText.textContent = `-${congestionPercent.toFixed(0)}%`;
    statDelayText.textContent = `-${((speedStat / 60) * 45).toFixed(0)}m`;
    statCo2Text.textContent = `-${(congestionPercent * 0.8).toFixed(0)}%`;
    statEmsText.textContent = `+${(emsVal + (isProactiveOptimization ? 15 : -10)).toFixed(0)}%`;

    // Sync metrics dashboard values
    dashSpeedVal.innerHTML = `${speedStat.toFixed(1)}<span>km/h</span>`;
    dashSpeedTrend.innerHTML = isProactiveOptimization
      ? `<i class="fa-solid fa-circle-up"></i> +16% flow recovery`
      : `<i class="fa-solid fa-circle-down"></i> -8% bottleneck shift`;

    let currentCo2Val = 1482 + Math.floor(congestionPercent * 1.2) + (isProactiveOptimization ? -120 : 80);
    document.getElementById('dash-val-carbon').innerHTML = `${currentCo2Val.toLocaleString()}<span>kg</span>`;
    
    let currentSync = isProactiveOptimization ? 94.2 + Math.sin(twinFrame * 0.01) * 1.2 : 62.4 + Math.cos(twinFrame * 0.01) * 1.8;
    document.getElementById('dash-val-sync').innerHTML = `${currentSync.toFixed(1)}<span>%</span>`;

    // Dynamic Predictions counter update
    if (twinFrame % 25 === 0) {
      predictionsCounter += Math.floor(Math.random() * 3) + 1;
    }
    document.getElementById('predictions-generated-count').textContent = predictionsCounter.toLocaleString();

    // Hotspots detected update
    let hotspotsCount = 41 + activeIncidentCount * 3 + (activeEvent !== 'none' ? 4 : 0) + (trafficDemand === 3 ? 8 : 0);
    document.getElementById('hotspots-detected-count').textContent = hotspotsCount;

    // Dynamically calculate and update City Health Score
    let healthScore = 87;
    healthScore -= (trafficDemand === 3 ? 8 : 0);
    healthScore -= (weatherProfile !== 'clear' ? 5 : 0);
    healthScore -= activeIncidentCount * 8;
    healthScore -= (activeEvent !== 'none' ? 6 : 0);
    healthScore += (isProactiveOptimization ? 12 : -6);
    healthScore = Math.max(40, Math.min(100, Math.round(healthScore + Math.sin(twinFrame * 0.01) * 1)));
    
    document.getElementById('health-score-num').textContent = healthScore;
    const healthRing = document.getElementById('health-score-ring');
    if (healthRing) {
      healthRing.style.strokeDashoffset = 213.6 * (1 - healthScore / 100);
    }

    // Update breakdowns
    const congestionRating = Math.max(45, Math.min(99, Math.round(100 - congestionPercent * 0.8)));
    const travelRating = Math.max(40, Math.min(99, Math.round(speedStat * 1.6)));
    const airRating = Math.max(45, Math.min(99, Math.round(100 - congestionPercent * 0.7 - (weatherProfile === 'fog' ? 12 : 0))));
    const incidentRating = Math.max(35, Math.min(99, Math.round(isProactiveOptimization ? 94 - activeIncidentCount * 2 : 72 - activeIncidentCount * 12)));

    document.getElementById('health-val-congestion').textContent = `${congestionRating}/100`;
    document.getElementById('health-bar-congestion').style.width = `${congestionRating}%`;
    document.getElementById('health-val-travel').textContent = `${travelRating}/100`;
    document.getElementById('health-bar-travel').style.width = `${travelRating}%`;
    document.getElementById('health-val-air').textContent = `${airRating}/100`;
    document.getElementById('health-bar-air').style.width = `${airRating}%`;
    document.getElementById('health-val-incident').textContent = `${incidentRating}/100`;
    document.getElementById('health-bar-incident').style.width = `${incidentRating}%`;

    // Draw Emergency Green Corridor path highlights
    if (isEmsCorridorActive) {
      const emsGridPath = [0, 1, 2, 5, 8];
      twinCtx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      twinCtx.lineWidth = 16;
      twinCtx.lineCap = 'round';
      twinCtx.lineJoin = 'round';
      twinCtx.beginPath();
      emsGridPath.forEach((nodeId, idx) => {
        const coords = getCoords(nodeId);
        if (idx === 0) twinCtx.moveTo(coords.x, coords.y);
        else twinCtx.lineTo(coords.x, coords.y);
      });
      twinCtx.stroke();
      
      // Pulse animation
      twinCtx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
      twinCtx.lineWidth = 10 + Math.sin(twinFrame * 0.1) * 3;
      twinCtx.stroke();
    }

    // Draw Roads (Edges)
    twinRoads.forEach(road => {
      const sCoords = getCoords(road.source);
      const tCoords = getCoords(road.target);
      
      // Determine active roadblocks/incidents on specific edges
      const isAccidentRoad = (isIncidentActive || activeIncidents.accident) && (road.source === 4 && road.target === 5);
      const isBreakdownRoad = activeIncidents.breakdown && ((road.source === 7 && road.target === 8) || (road.source === 8 && road.target === 7));
      const isBlockageRoad = activeIncidents.blockage && ((road.source === 1 && road.target === 4) || (road.source === 4 && road.target === 1));

      // Congestion levels affect road color
      let roadColor = 'rgba(255, 255, 255, 0.06)';
      let roadLineWidth = 8;
      
      if (isAccidentRoad) {
        roadColor = 'rgba(255, 82, 82, 0.45)';
        roadLineWidth = 10;
      } else if (isBreakdownRoad) {
        roadColor = 'rgba(255, 171, 0, 0.45)';
        roadLineWidth = 10;
      } else if (isBlockageRoad) {
        roadColor = 'rgba(157, 78, 221, 0.45)';
        roadLineWidth = 10;
      } else if (trafficDemand === 3 && !isProactiveOptimization) {
        roadColor = 'rgba(255, 171, 0, 0.25)'; // Amber warning
      } else if (trafficDemand === 3 && isProactiveOptimization) {
        roadColor = 'rgba(0, 230, 118, 0.15)'; // AI optimized flowing
      }

      twinCtx.strokeStyle = roadColor;
      twinCtx.lineWidth = roadLineWidth;
      twinCtx.lineCap = 'round';
      twinCtx.beginPath();
      twinCtx.moveTo(sCoords.x, sCoords.y);
      twinCtx.lineTo(tCoords.x, tCoords.y);
      twinCtx.stroke();

      // Outer lane glow border
      twinCtx.strokeStyle = 'rgba(255,255,255,0.03)';
      twinCtx.lineWidth = roadLineWidth + 4;
      twinCtx.stroke();
    });

    // Draw road intersection nodes
    twinIntersections.forEach(inter => {
      const coords = getCoords(inter.id);
      
      // Adaptive signal controls switching
      inter.lightTimer += isProactiveOptimization ? 1.4 : 0.6; // Speed up signal processing if AI is active
      const phase = Math.floor(inter.lightTimer / 60) % 2;
      inter.lightColor = phase === 0 ? '#00e676' : '#ff5252';

      // Override: Force green light at nodes along active green corridor
      if (isEmsCorridorActive) {
        const emsGridPath = [0, 1, 2, 5, 8];
        if (emsGridPath.includes(inter.id)) {
          inter.lightColor = '#00e676';
        }
      }

      // Draw junction node base
      twinCtx.fillStyle = '#080a12';
      twinCtx.strokeStyle = 'rgba(255,255,255,0.1)';
      twinCtx.lineWidth = 2;
      twinCtx.beginPath();
      twinCtx.arc(coords.x, coords.y, 14, 0, Math.PI * 2);
      twinCtx.fill();
      twinCtx.stroke();

      // Inner traffic light
      twinCtx.fillStyle = inter.lightColor;
      twinCtx.shadowColor = inter.lightColor;
      twinCtx.shadowBlur = 5;
      twinCtx.beginPath();
      twinCtx.arc(coords.x, coords.y, 4, 0, Math.PI * 2);
      twinCtx.fill();
      twinCtx.shadowBlur = 0; // reset
    });

    // Draw vehicles flowing
    simulatedCars.forEach(car => {
      const sCoords = getCoords(car.road.source);
      const tCoords = getCoords(car.road.target);

      // Interpolate progress along road link
      let vFactor = 1.0;
      if (weatherProfile === 'rain') vFactor = 0.6;
      else if (weatherProfile === 'fog') vFactor = 0.4;
      else if (weatherProfile === 'heatwave') vFactor = 0.85;

      // Incident roadblocks slow down standard cars on corresponding roads
      const isAccidentRoad = (isIncidentActive || activeIncidents.accident) && (car.road.source === 4 && car.road.target === 5);
      const isBreakdownRoad = activeIncidents.breakdown && ((car.road.source === 7 && car.road.target === 8) || (car.road.source === 8 && car.road.target === 7));
      const isBlockageRoad = activeIncidents.blockage && ((car.road.source === 1 && car.road.target === 4) || (car.road.source === 4 && car.road.target === 1));

      if ((isAccidentRoad || isBreakdownRoad || isBlockageRoad) && !isProactiveOptimization) {
        vFactor *= 0.15; // standard delays make cars crawl
      }

      if (car.direction === 1) {
        car.progress += car.vx * vFactor;
        if (car.progress >= 1.0) car.progress = 0;
      } else {
        car.progress -= car.vx * vFactor;
        if (car.progress <= 0) car.progress = 1.0;
      }

      if (isAccidentRoad || isBreakdownRoad || isBlockageRoad) {
        if (!isProactiveOptimization) {
          const stopLocation = 0.5;
          if (car.direction === 1 && car.progress > 0.1 && car.progress < 0.5) {
            car.progress = 0.45; // gridlock stop
            car.color = '#ff5252'; // Alert congested Red
          }
        } else {
          car.color = '#00e676'; // optimized green wave
        }
      } else {
        car.color = car.isEmergency ? '#ff5252' : '#00f0ff';
      }

      const cx = sCoords.x + (tCoords.x - sCoords.x) * car.progress;
      const cy = sCoords.y + (tCoords.y - sCoords.y) * car.progress;

      // Draw car
      twinCtx.fillStyle = car.color;
      if (car.isEmergency) {
        // Blinking emergency vehicle visual
        const flash = Math.sin(twinFrame * 0.4) > 0;
        twinCtx.fillStyle = flash ? '#ff5252' : '#00f0ff';
        twinCtx.shadowColor = twinCtx.fillStyle;
        twinCtx.shadowBlur = 10;
        twinCtx.beginPath();
        twinCtx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        twinCtx.fill();
        twinCtx.shadowBlur = 0;
      } else {
        twinCtx.beginPath();
        twinCtx.arc(cx, cy, 3, 0, Math.PI * 2);
        twinCtx.fill();
      }
    });

    // Draw custom Ambulance green corridor travel
    if (isEmsCorridorActive) {
      const emsGridPath = [0, 1, 2, 5, 8];
      
      // Advance progress
      emsProgress += 0.0022; // takes ~7 seconds to complete trip
      
      if (emsProgress >= 1.0) {
        emsProgress = 1.0;
        isEmsCorridorActive = false;
        emsBtn.classList.remove('active');
        emsBtn.innerHTML = `<i class="fa-solid fa-truck-medical"></i> Activate Green Corridor`;
        emsStatsPanel.style.display = 'none';
        addSimLog(`Ambulance safely arrived at Trauma Care hospital. Corridor released.`, 'system');
      } else {
        // Find segment coords
        const totalSegments = emsGridPath.length - 1;
        const segmentIdx = Math.min(totalSegments - 1, Math.floor(emsProgress * totalSegments));
        const segT = (emsProgress * totalSegments) - segmentIdx;
        
        const nodeA = getCoords(emsGridPath[segmentIdx]);
        const nodeB = getCoords(emsGridPath[segmentIdx + 1]);
        const amX = nodeA.x + (nodeB.x - nodeA.x) * segT;
        const amY = nodeA.y + (nodeB.y - nodeA.y) * segT;
        
        // Draw flashing Ambulance vehicle on path
        const flashColor = Math.floor(twinFrame / 5) % 2 === 0 ? '#ff5252' : '#00f0ff';
        twinCtx.fillStyle = flashColor;
        twinCtx.strokeStyle = '#ffffff';
        twinCtx.lineWidth = 2;
        twinCtx.shadowColor = flashColor;
        twinCtx.shadowBlur = 15;
        
        twinCtx.beginPath();
        twinCtx.arc(amX, amY, 8, 0, Math.PI * 2);
        twinCtx.fill();
        twinCtx.stroke();
        twinCtx.shadowBlur = 0; // reset
        
        // Draw text label above it
        twinCtx.fillStyle = '#ffffff';
        twinCtx.font = 'bold 9px monospace';
        twinCtx.fillText('🚑 EMS', amX - 16, amY - 12);
        
        // Update stats counters
        const optEta = Math.max(1, Math.round(11 - emsProgress * 10));
        emsNormalEtaText.textContent = `18 min`;
        emsOptimizedEtaText.textContent = `${optEta} min`;
        emsTimeSavedText.textContent = `${18 - optEta} min`;
      }
    }

    // Draw active incidents (roadblocks/accidents warnings)
    if (isIncidentActive || activeIncidents.accident) {
      const nodeA = getCoords(4);
      const nodeB = getCoords(5);
      const crashX = (nodeA.x + nodeB.x) / 2;
      const crashY = (nodeA.y + nodeB.y) / 2;
      drawIncidentMarker(crashX, crashY, '#ff5252', '🚨 Accident');
    }
    if (activeIncidents.breakdown) {
      const nodeA = getCoords(7);
      const nodeB = getCoords(8);
      const brX = (nodeA.x + nodeB.x) / 2;
      const brY = (nodeA.y + nodeB.y) / 2;
      drawIncidentMarker(brX, brY, '#ffab00', '🚧 Breakdown');
    }
    if (activeIncidents.blockage) {
      const nodeA = getCoords(1);
      const nodeB = getCoords(4);
      const blX = (nodeA.x + nodeB.x) / 2;
      const blY = (nodeA.y + nodeB.y) / 2;
      drawIncidentMarker(blX, blY, '#9d4edd', '🛑 Blockage');
    }

    // Helper incident drawer
    function drawIncidentMarker(x, y, color, label) {
      twinCtx.fillStyle = color;
      twinCtx.strokeStyle = '#ffffff';
      twinCtx.lineWidth = 1.5;
      twinCtx.shadowColor = color;
      twinCtx.shadowBlur = 10;
      twinCtx.beginPath();
      twinCtx.moveTo(x, y - 8);
      twinCtx.lineTo(x - 8, y + 7);
      twinCtx.lineTo(x + 8, y + 7);
      twinCtx.closePath();
      twinCtx.fill();
      twinCtx.stroke();
      twinCtx.shadowBlur = 0;
      
      twinCtx.fillStyle = '#ffffff';
      twinCtx.font = 'bold 7px sans-serif';
      twinCtx.fillText('!', x - 1, y + 5);
      
      twinCtx.fillStyle = color;
      twinCtx.font = '8px monospace';
      twinCtx.fillText(label, x - 25, y - 12);
    }

    // Draw citizen reported pins
    citizenPins.forEach(pin => {
      const pColor = pin.type === 'accident' ? '#ff5252' : pin.type === 'pothole' ? '#ffab00' : pin.type === 'closure' ? '#9d4edd' : '#00f0ff';
      twinCtx.fillStyle = pColor;
      twinCtx.strokeStyle = '#ffffff';
      twinCtx.lineWidth = 1;
      
      const pulse = (Math.sin(twinFrame * 0.1) + 1) / 2;
      twinCtx.shadowColor = pColor;
      twinCtx.shadowBlur = 6 + pulse * 6;
      
      twinCtx.beginPath();
      twinCtx.arc(pin.x, pin.y, 6, 0, Math.PI * 2);
      twinCtx.fill();
      twinCtx.stroke();
      twinCtx.shadowBlur = 0;
      
      twinCtx.fillStyle = '#ffffff';
      twinCtx.font = '9px Arial';
      let icon = '📍';
      if (pin.type === 'accident') icon = '🚨';
      else if (pin.type === 'pothole') icon = '🕳️';
      else if (pin.type === 'closure') icon = '🚧';
      else if (pin.type === 'waterlogging') icon = '💧';
      twinCtx.fillText(icon, pin.x - 5, pin.y - 8);
    });
  }

  // Helper log utility for the simulation control box
  const logStream = document.getElementById('log-stream');
  function addSimLog(msg, type = 'normal') {
    const time = new Date().toTimeString().split(' ')[0];
    const logLine = document.createElement('div');
    logLine.classList.add('log-line');
    if (type !== 'normal') logLine.classList.add(type);
    logLine.innerHTML = `<span>[${time}]</span> ${msg}`;
    logStream.appendChild(logLine);
    
    // Auto scroll to bottom
    logStream.scrollTop = logStream.scrollHeight;
    
    // Keep max 20 logs
    while (logStream.children.length > 25) {
      logStream.removeChild(logStream.firstChild);
    }
  }

  // ==========================================
  // 7. REAL-TIME ROLLING DASHBOARD CHART
  // ==========================================
  const chartCanvas = document.getElementById('dashboard-chart-canvas');
  const chartCtx = chartCanvas.getContext('2d');
  
  function resizeChartCanvas() {
    const parent = chartCanvas.parentElement;
    chartCanvas.width = parent.clientWidth;
    chartCanvas.height = parent.clientHeight || 180;
  }
  resizeChartCanvas();
  window.addEventListener('resize', resizeChartCanvas);

  // Tab management for charts & custom panels
  const dashTabs = document.querySelectorAll('.dash-tab-btn');
  let activeChartTab = 'speed';
  
  const chartCanvasContainer = document.getElementById('chart-canvas-container');
  const sustainabilityPanel = document.getElementById('sustainability-panel');
  const executivePanel = document.getElementById('executive-panel');

  dashTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dashTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeChartTab = tab.getAttribute('data-grid');
      addSimLog(`Dashboard telemetry switch view: ${activeChartTab.toUpperCase()}`);
      
      // Hide all panels
      chartCanvasContainer.style.display = 'none';
      sustainabilityPanel.style.display = 'none';
      executivePanel.style.display = 'none';

      // Toggle requested panel
      if (activeChartTab === 'executive') {
        executivePanel.style.display = 'block';
      } else if (activeChartTab === 'co2') {
        sustainabilityPanel.style.display = 'block';
      } else {
        chartCanvasContainer.style.display = 'block';
      }
    });
  });

  // Incident locate handlers
  document.getElementById('locate-accident-btn').addEventListener('click', () => {
    isIncidentActive = true;
    activeIncidents.accident = true;
    document.getElementById('sandbox').scrollIntoView({ behavior: 'smooth' });
    addSimLog(`Command Center focused on Accident at Broadway Corridor (Junction 4-5).`, 'error');
  });

  document.getElementById('locate-breakdown-btn').addEventListener('click', () => {
    activeIncidents.breakdown = true;
    document.getElementById('sandbox').scrollIntoView({ behavior: 'smooth' });
    addSimLog(`Command Center focused on Stalled Truck at Junction 7-8.`, 'warn');
  });

  document.getElementById('locate-blockage-btn').addEventListener('click', () => {
    activeIncidents.blockage = true;
    document.getElementById('sandbox').scrollIntoView({ behavior: 'smooth' });
    addSimLog(`Command Center focused on Road Blockage at Junction 1-4.`, 'warn');
  });

  // Executive Decision actions
  document.getElementById('btn-rec-signal').addEventListener('click', (e) => {
    e.target.textContent = 'Applied ✓';
    e.target.style.background = 'var(--neon-green)';
    e.target.style.color = '#000';
    isProactiveOptimization = true;
    const optBtn = document.getElementById('opt-toggle-btn');
    optBtn.classList.add('active');
    optBtn.innerHTML = `<i class="fa-solid fa-toggle-on"></i> AI Optimization: ON`;
    addSimLog(`EXECUTIVE POLICY: Signal phase adjustment applied at Junction 12.`, 'system');
  });

  document.getElementById('btn-rec-diversion').addEventListener('click', (e) => {
    e.target.textContent = 'Open ✓';
    e.target.style.background = 'var(--neon-green)';
    e.target.style.color = '#000';
    addSimLog(`EXECUTIVE POLICY: Corridor 4 dynamic diversion route opened.`, 'system');
    if (isIncidentActive || activeIncidents.accident) {
      addSimLog(`Diversion absorbing 45% load. Broadway gridlock resolving.`, 'cyan');
    }
  });

  document.getElementById('btn-rec-warden').addEventListener('click', (e) => {
    e.target.textContent = 'Deployed ✓';
    e.target.style.background = 'var(--neon-green)';
    e.target.style.color = '#000';
    addSimLog(`EXECUTIVE POLICY: Officer dispatched to Sector 4. Manual coordination active.`, 'system');
  });

  // Smart Junction Explorer panel controls
  const explorerPanel = document.getElementById('junction-explorer');
  const closeExplorerBtn = document.getElementById('close-explorer-btn');
  const overrideSignalBtn = document.getElementById('override-signal-btn');

  closeExplorerBtn.addEventListener('click', () => {
    explorerPanel.style.display = 'none';
    selectedJunction = null;
  });

  overrideSignalBtn.addEventListener('click', () => {
    if (selectedJunction !== null) {
      const jNode = twinIntersections.find(n => n.id === selectedJunction);
      if (jNode) {
        jNode.lightTimer = 0; // Force Green wave phase
        jNode.lightColor = '#00e676';
        addSimLog(`OVERRIDE: Manual signal override green light wave sent to Junction ${selectedJunction + 1}.`, 'system');
        explorerPanel.style.display = 'none';
        selectedJunction = null;
      }
    }
  });

  // Twin Canvas Click Event for reporting pins and junction explorer
  twinCanvas.addEventListener('click', (e) => {
    const rect = twinCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Convert to logical coordinates
    const lx = (mx / rect.width) * twinCanvas.width;
    const ly = (my / rect.height) * twinCanvas.height;
    
    if (citizenReportMode !== null) {
      // Add citizen pin
      citizenPins.push({
        x: lx,
        y: ly,
        type: citizenReportMode,
        timestamp: Date.now()
      });
      addSimLog(`CITIZEN REPORT: ${citizenReportMode.toUpperCase()} logged at grid coordinate (${lx.toFixed(0)}, ${ly.toFixed(0)}).`, 'warn');
      
      // Reset button active class
      const activeBtn = document.querySelector(`.report-btn[data-report="${citizenReportMode}"]`);
      if (activeBtn) activeBtn.classList.remove('active');
      
      citizenReportMode = null;
      reportingIndicator.style.display = 'none';
    } else {
      // Try to select close intersection node
      let clickedNode = null;
      const padX = twinCanvas.width * 0.12;
      const padY = twinCanvas.height * 0.12;
      const usableW = twinCanvas.width - padX * 2;
      const usableH = twinCanvas.height - padY * 2;
      const cols = 3;
      
      twinIntersections.forEach(inter => {
        const nx = padX + (inter.c / (cols - 1)) * usableW;
        const ny = padY + (inter.r / (cols - 1)) * usableH;
        
        if (Math.hypot(nx - lx, ny - ly) < 22) {
          clickedNode = inter;
        }
      });
      
      if (clickedNode !== null) {
        selectedJunction = clickedNode.id;
        document.getElementById('explorer-junction-name').textContent = `Junction ${selectedJunction + 1} (${String.fromCharCode(65 + selectedJunction)} Corridor)`;
        
        const queueLength = Math.floor(Math.random() * 8) + (trafficDemand * 3);
        const waitTime = queueLength * 4;
        const risk = isProactiveOptimization ? 'LOW (14%)' : (trafficDemand === 3 ? 'CRITICAL (92%)' : 'HIGH (72%)');
        
        document.getElementById('exp-queue').textContent = `${queueLength} vehicles`;
        document.getElementById('exp-wait').textContent = `${waitTime}s`;
        document.getElementById('exp-signals').textContent = clickedNode.lightColor === '#00e676' ? '30s Green Wave' : '25s Red Delay';
        
        const riskText = document.getElementById('exp-risk');
        riskText.textContent = risk;
        if (isProactiveOptimization) {
          riskText.className = 'explorer-val text-green';
        } else {
          riskText.className = 'explorer-val text-red';
        }
        
        document.getElementById('exp-delay').textContent = `+${(queueLength * 1.5).toFixed(0)}s`;
        explorerPanel.style.display = 'block';
        addSimLog(`Telemetry loaded for Junction ${selectedJunction + 1}. Explorer opened.`);
      }
    }
  });

  const chartPoints = Array(20).fill(30);
  let chartTimer = 0;

  function updateChartData() {
    chartTimer++;
    if (chartTimer % 30 === 0) {
      // Calculate current value based on sandbox state
      let val = 35;
      if (activeChartTab === 'speed') {
        val = 30 + (trafficDemand === 1 ? 15 : trafficDemand === 3 ? -10 : 0);
        if (isProactiveOptimization) val += 12;
        val += Math.sin(chartTimer * 0.05) * 3;
      } else if (activeChartTab === 'co2') {
        val = 20 + (isProactiveOptimization ? 35 : 10) + Math.cos(chartTimer * 0.04) * 4;
      } else if (activeChartTab === 'signal') {
        val = (isProactiveOptimization ? 85 : 55) + Math.sin(chartTimer * 0.05) * 5;
      }
      
      chartPoints.shift();
      chartPoints.push(val);
    }
  }

  function drawDashboardChart() {
    const w = chartCanvas.width;
    const h = chartCanvas.height;
    chartCtx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    chartCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    chartCtx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = 15 + (i / 4) * (h - 30);
      chartCtx.beginPath();
      chartCtx.moveTo(25, y);
      chartCtx.lineTo(w - 15, y);
      chartCtx.stroke();
    }

    // Chart path settings
    chartCtx.strokeStyle = activeChartTab === 'speed' ? varColor('--neon-cyan') : activeChartTab === 'co2' ? varColor('--neon-green') : varColor('--neon-purple');
    chartCtx.lineWidth = 2.5;
    
    // Draw gradient flow fill under chart line
    const fillGrad = chartCtx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, activeChartTab === 'speed' ? 'rgba(0, 240, 255, 0.12)' : activeChartTab === 'co2' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(157, 78, 221, 0.12)');
    fillGrad.addColorStop(1, 'rgba(0,0,0,0)');

    chartCtx.fillStyle = fillGrad;
    chartCtx.beginPath();
    
    const maxVal = activeChartTab === 'signal' ? 100 : 70;
    
    chartPoints.forEach((val, idx) => {
      const cx = 25 + (idx / (chartPoints.length - 1)) * (w - 40);
      const cy = h - 15 - (val / maxVal) * (h - 30);
      
      if (idx === 0) {
        chartCtx.moveTo(cx, cy);
      } else {
        chartCtx.lineTo(cx, cy);
      }
    });

    // Close path for fill
    const firstX = 25;
    const lastX = 25 + (w - 40);
    
    chartCtx.stroke();
    
    // Fill under area
    chartCtx.lineTo(lastX, h - 10);
    chartCtx.lineTo(firstX, h - 10);
    chartCtx.closePath();
    chartCtx.fill();

    // Helper color getter
    function varColor(cssVarName) {
      if (cssVarName === '--neon-cyan') return '#00f0ff';
      if (cssVarName === '--neon-green') return '#00e676';
      if (cssVarName === '--neon-purple') return '#9d4edd';
      return '#ffffff';
    }
  }

  // ==========================================
  // 8. USE CASES MULTI-TAB DISPLAY SELECTOR
  // ==========================================
  const usecaseBtns = document.querySelectorAll('.usecase-btn');
  const usecasePanels = document.querySelectorAll('.usecase-panel');

  usecaseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      usecaseBtns.forEach(b => b.classList.remove('active'));
      usecasePanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const ucId = btn.getAttribute('data-usecase');
      document.getElementById(`uc-${ucId}`).classList.add('active');
      
      addSimLog(`Client deployment vertical loaded: ${ucId.toUpperCase()}`);
    });
  });

  // ==========================================
  // 9. HIGH-TECH AI CO-PILOT CHATBOT LOGIC
  // ==========================================
  const chatToggle = document.getElementById('chat-toggle');
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');

  chatToggle.addEventListener('click', () => {
    const isOpen = chatWindow.classList.toggle('open');
    chatToggle.classList.toggle('open');
    if (isOpen) {
      chatInput.focus();
    }
  });

  // Handle message sending
  chatSend.addEventListener('click', handleUserSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserSendMessage();
  });

  // Suggestions clicking
  chatMessages.addEventListener('click', (e) => {
    if (e.target.classList.contains('chat-suggest-btn')) {
      const msg = e.target.getAttribute('data-query');
      chatInput.value = msg;
      handleUserSendMessage();
    }
  });

  const responseKnowledge = {
    'prediction': 'FlowAI uses Spatio-Temporal Graph Neural Networks. Rather than seeing roads in isolation, it formats the city street map as a topological graph grid. It tracks delay propagation dynamics—calculating how speed drops in one intersection cascade to others 30-45 minutes in advance.',
    'hardware': 'FlowAI is 100% infrastructure-independent. It ingests existing cellular network coordinates (LBS), vehicle GPS telemetry fleets, public transit feeds, and weather APIs. No expensive loop detector upgrades or optical intersection camera setups are required.',
    'clients': 'Our typical deployments serve Municipal Transit Authorities, Emergency Dispatch Controllers seeking prioritized transit routes, Smart City developers, and commercial delivery fleets interested in predictable routing windows.',
    'mgroad': '🚨 <strong>GNN Peak Hour Closure Impact: MG Road</strong><br><br><strong>1. Affected Corridors:</strong><br>• MG Road Bypass (Gridlock predicted in 10m)<br>• Broadway Corridor (+45% traffic backup)<br>• Sector 4 Link Road (+30% queue surge)<br><br><strong>2. Delay Forecast:</strong><br>• Average travel time increases by <strong>14 minutes</strong>.<br>• Grid mobility health score drops by <strong>12 points</strong>.<br><br><strong>3. Smart Diversions:</strong><br>• Reroute commercial vehicles through Outer Highway.<br>• Dynamic green wave priority shifted to Sector 3 Corridor.',
    'default': 'FlowAI manages network traffic dynamically using Cooperative Multi-agent Reinforcement Learning and Graph Neural Nets to adapt traffic grids proactively. Let me know if you would like me to trigger an incident block in the Sandbox above!'
  };

  function handleUserSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append User message
    appendChatBubble(text, 'user');
    chatInput.value = '';

    // Append typing bubble
    const typingBubble = document.createElement('div');
    typingBubble.classList.add('chat-bubble', 'bot');
    typingBubble.innerHTML = `
      <div class="chat-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Match keywords
    let matchKey = 'default';
    const lower = text.toLowerCase();
    if (lower.includes('predict') || lower.includes('forecast') || lower.includes('work')) {
      matchKey = 'prediction';
    } else if (lower.includes('hardware') || lower.includes('sensor') || lower.includes('iot')) {
      matchKey = 'hardware';
    } else if (lower.includes('client') || lower.includes('government') || lower.includes('smart')) {
      matchKey = 'clients';
    } else if (lower.includes('mg road') || lower.includes('mgroad') || lower.includes('peak') || lower.includes('closes') || lower.includes('mg')) {
      matchKey = 'mgroad';
    }

    // Simulate AI thinking and reply
    setTimeout(() => {
      typingBubble.remove();
      appendChatBubble(responseKnowledge[matchKey], 'bot');
    }, 1200);
  }

  function appendChatBubble(text, sender) {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', sender);
    if (sender === 'bot') {
      bubble.innerHTML = text;
    } else {
      bubble.textContent = text;
    }
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ==========================================
  // 10. MAIN SYSTEM TICK ANIMATOR RUNNER
  // ==========================================
  function systemTick() {
    // 1. Particle floating background
    drawBgParticles();
    
    // 2. Hero Interactive topological corridor canvas
    drawHeroNetwork();

    // 3. Spatio-Temporal GNN connection propagation
    drawGnnSimulation();

    // 4. Multi-agent RL adaptive intersection signals
    drawRlSimulation();

    // 5. Grid sandbox digital twin corridor
    runTwinSimulation();

    // 6. Rolling dashboard chart
    updateChartData();
    drawDashboardChart();

    requestAnimationFrame(systemTick);
  }

  // Launch global runner
  systemTick();
});
