document.getElementById('analyze-btn').addEventListener('click', async () => {
  const serviceInput = document.getElementById('service-input').value.trim();
  if (!serviceInput) return;

  // UI state updates
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
  document.getElementById('no-impact').classList.add('hidden');
  
  try {
    const response = await fetch(`/api/impact/${encodeURIComponent(serviceInput)}`);
    const data = await response.json();
    
    document.getElementById('loading').classList.add('hidden');
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze impact');
    }

    document.getElementById('failing-node-display').textContent = data.failingService;
    document.getElementById('results').classList.remove('hidden');
    
    const tbody = document.getElementById('impact-tbody');
    tbody.innerHTML = '';
    
    if (data.impact.length === 0) {
      document.getElementById('impact-table').classList.add('hidden');
      document.getElementById('no-impact').classList.remove('hidden');
    } else {
      document.getElementById('impact-table').classList.remove('hidden');
      
      data.impact.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.affectedService}</td>
          <td>${item.hops} hop(s)</td>
          <td><span class="badge team-badge">${item.teamToNotify}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
    
  } catch (err) {
    document.getElementById('loading').classList.add('hidden');
    const errorEl = document.getElementById('error');
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});
