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