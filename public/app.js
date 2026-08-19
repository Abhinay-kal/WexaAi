let network = null;
let nodesDataset = null;
let edgesDataset = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initGraph();
});

async function initGraph() {
  try {
    const res = await fetch('/api/graph');
    const data = await res.json();
    
    // Create vis.js datasets
    nodesDataset = new vis.DataSet(data.nodes.map(n => ({
      ...n,
      color: { background: '#D2E5FF', border: '#2B7CE9' },
      font: { color: '#333' }
    })));
    edgesDataset = new vis.DataSet(data.edges.map(e => ({
      ...e,
      arrows: 'to',
      color: { color: '#848484' }
    })));

    const container = document.getElementById('network');
    const networkData = { nodes: nodesDataset, edges: edgesDataset };
    const options = {
      physics: { stabilization: true },
      nodes: { shape: 'box', margin: 10 }
    };
    network = new vis.Network(container, networkData, options);
  } catch (e) {
    console.error('Failed to load initial graph', e);
  }
}

document.getElementById('searchBtn').addEventListener('click', async () => {
  const serviceName = document.getElementById('serviceInput').value.trim();
  if (!serviceName) return;

  const resultsDiv = document.getElementById('results');
  const tbody = document.querySelector('#impactTable tbody');
  const serviceNameSpan = document.getElementById('serviceNameDisplay');
  const errorDiv = document.getElementById('error');

  errorDiv.classList.add('hidden');
  resultsDiv.classList.add('hidden');
  tbody.innerHTML = '';

  // Reset graph colors
  nodesDataset.forEach(node => {
    nodesDataset.update({ id: node.id, color: { background: '#D2E5FF', border: '#2B7CE9' } });
  });

  try {
    const res = await fetch(`/api/impact/${encodeURIComponent(serviceName)}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    serviceNameSpan.textContent = serviceName;
    
    // Highlight root node
    if (nodesDataset.get(serviceName)) {
      nodesDataset.update({ id: serviceName, color: { background: '#FF4D4D', border: '#CC0000' } });
    }

    const affectedNodes = new Set();
    
    data.impact.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.dependent}</td>
        <td>${row.hops} hop(s)</td>
        <td><span class="badge badge-${row.team.toLowerCase()}">${row.team}</span></td>
      `;
      tbody.appendChild(tr);
      
      affectedNodes.add(row.dependent);
    });

    // Highlight affected nodes in orange
    affectedNodes.forEach(nodeId => {
      if (nodesDataset.get(nodeId)) {
        nodesDataset.update({ id: nodeId, color: { background: '#FFA500', border: '#CC8400' } });
      }
    });

    resultsDiv.classList.remove('hidden');
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove('hidden');
  }
});
