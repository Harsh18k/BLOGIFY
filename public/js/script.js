document.addEventListener("DOMContentLoaded", () => {
    const alerts = document.querySelectorAll(".flash-wrapper .alert");
  
    alerts.forEach(alert => {
      setTimeout(() => {
        alert.classList.remove("show");
        alert.classList.add("fade");
  
        setTimeout(() => {
          alert.closest(".flash-wrapper")?.remove();
        }, 300);
      }, 2500);
    });
  });