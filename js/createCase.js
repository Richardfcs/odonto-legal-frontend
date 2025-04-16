document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Você precisa estar autenticado para cadastrar casos.');
      window.location.href = 'login.html';
      return;
    }
  
    const form = document.getElementById('caseForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // coleta dos valores do formulário
      const nameCase    = document.getElementById('nameCase').value.trim();
      const Description = document.getElementById('description').value.trim();
      const status      = document.getElementById('status').value;
      const location    = document.getElementById('location').value.trim();
      const dateCase    = document.getElementById('dateCase').value;  // yyyy‑MM‑dd ou vazio
      const hourCase    = document.getElementById('hourCase').value;  // HH:mm ou vazio
      const category    = document.getElementById('category').value;
  
      // validação rápida de obrigatoriedade
      if (!nameCase || !status || !location || !category) {
        alert('Preencha todos os campos obrigatórios (nome, status, local e categoria).');
        return;
      }
  
      // prepara objeto a ser enviado
      const payload = {
        nameCase,
        Description,
        status,
        location,
        category
      };
      // inclui data/hora se preenchidos
      if (dateCase) payload.dateCase = dateCase;
      if (hourCase) payload.hourCase = hourCase;
  
      try {
        const res = await fetch('http://localhost:3000/api/case', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok) {
          alert(json.message || 'Caso criado com sucesso!');
          form.reset();
        } else {
          alert(json.error || json.message || 'Erro ao criar caso.');
        }
      } catch (err) {
        console.error('Erro na requisição:', err);
        alert('Erro de conexão. Tente novamente.');
      }
    });
  });
  