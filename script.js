window.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loaderScreen");
  const app = document.getElementById("app");
  const btnReady = document.getElementById("btnReady");
  const btnSurprise = document.getElementById("btnSurprise");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDesc = document.getElementById("lightboxDesc");
  const lightboxClose = document.getElementById("lightboxClose");

  function enterSite() {
    loader.classList.add("is-hidden");
    app.classList.remove("app--hidden");
    setTimeout(() => loader.setAttribute("aria-hidden", "true"), 500);
  }

  btnReady?.addEventListener("click", enterSite);
  btnSurprise?.addEventListener("click", enterSite);

  function openLightbox(img, title, desc) {
    lightboxImg.src = img;
    lightboxTitle.textContent = title;
    lightboxDesc.textContent = desc;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxImg.src = "";
  }

  document.addEventListener("click", (e) => {
    const imgZone = e.target.closest(".memory-img");
    if (!imgZone) return;
    const card = imgZone.closest(".memory");

    openLightbox(card.dataset.img, card.dataset.title, card.dataset.desc);
  });

  lightboxClose?.addEventListener("click", closeLightbox);

  lightbox?.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("open")) closeLightbox();
    });
    onload = () => {
    document.body.classList.remove("container");
  };
  $(document).ready(function(){
      $('.left-curtain').css('width', '0%');
      $('.right-curtain').css('width', '0%');
    
      $('.valentines-day').click(function(){
        $('.envelope').css({'animation':'fall 3s linear 1', '-webkit-animation':'fall 3s linear 1'});
        $('.envelope').fadeOut(800, function() {
          $('.valentines-day .heart, .valentines-day .text, .valentines-day .front').hide();
          $('#card').css({'visibility':'visible', 'opacity': 0, 'transform': 'scale(0.1)'});
          $('#card').animate({'opacity': 1}, {duration: 1000, step: function(now, fx) {
            var scale = 1 + Math.sin(now * Math.PI) * 0.1;
            $(this).css('transform', 'scale(' + scale + ')');
          }}); 
        });
      });
    });
  const waNumber = "593984961940";
  function openWhatsApp(answer) {
    let texto = "";

    if (answer === "Sí") {
      texto = "Chi salgasmo jiji diga diga como es el pan";
    } else if (answer === "No") {
      texto = "No puedo ser tu San Valentin porq-------";
    } else {
      texto = `Respuesta a la carta: ${answer}`;
    }

    const msg = encodeURIComponent(texto);
    window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");
  }

  document.getElementById("btnYes")?.addEventListener("click", () => openWhatsApp("Sí"));
  document.getElementById("btnNo")?.addEventListener("click", () => openWhatsApp("No"));
});
