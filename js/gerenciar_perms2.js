       // Função para controle do carrossel
       let currentSlide = 0;
       const slides = document.querySelectorAll('#carrossel > div');
       const totalSlides = slides.length;

       document.getElementById('next').addEventListener('click', function () {
           if (currentSlide < totalSlides - 1) {
               currentSlide++;
               updateCarousel();
           }
       });

       document.getElementById('prev').addEventListener('click', function () {
           if (currentSlide > 0) {
               currentSlide--;
               updateCarousel();
           }
       });

       function updateCarousel() {
           const offset = -(currentSlide * 100);
           document.getElementById('carrossel').style.transform = `translateX(${offset}%)`;
       }

       // Adicionando interatividade para destacar a seleção
       document.querySelectorAll('input[type="radio"]').forEach(input => {
           input.addEventListener('change', function () {
               // Remove a seleção anterior
               document.querySelectorAll('.peer-checked').forEach(el => {
                   el.classList.remove('peer-checked:ring-2', 'peer-checked:ring-green-700', 'peer-checked:ring-red-700');
               });

               // Aplica a classe ao novo selecionado
               const label = this.closest('td').querySelector('label');
               label.querySelector('div').classList.add(this.value === 'sim' ? 'peer-checked:ring-2' : 'peer-checked:ring-2');
               label.querySelector('div').classList.add(this.value === 'sim' ? 'peer-checked:ring-green-700' : 'peer-checked:ring-red-700');
           });
       });
