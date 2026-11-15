// MÉTODO B: Detección por Script de JS (Guía PWA)
if (window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent)) {
  console.log("Dispositivo Móvil o Tablet Detectado: Cargando Modo PWA");
}

// 🆕 REGISTRO DEL SERVICE WORKER (Hace que la página sea instalable y offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.log('Error al registrar Service Worker:', error);
      });
  });
}

$(document).ready(function() {
  let carrito = [];
  let bitacora = [];
  const COSTO_ENVIO = 5;
  let timerInterval = null;

  const productos = [
    { id: 1, nombre: 'Polera Oficial', cat: 'ropa', precio: 25, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
    { id: 2, nombre: 'Gorra Ragnarok', cat: 'ropa', precio: 15, img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400' },
    { id: 3, nombre: 'Mouse RGB', cat: 'perifericos', precio: 40, img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400' },
    { id: 4, nombre: 'Teclado Mecánico', cat: 'perifericos', precio: 85, img: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400' }
  ];

  // Reloj de contacto
  function actualizarRelojContacto() {
    const ahora = new Date();
    const h = String(ahora.getHours()).padStart(2, '0');
    const m = String(ahora.getMinutes()).padStart(2, '0');
    const s = String(ahora.getSeconds()).padStart(2, '0');
    if ($('#clockTime').length > 0) $('#clockTime').text(`${h}:${m}:${s}`);
    if ($('#clockDate').length > 0) $('#clockDate').text(ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }
  setInterval(actualizarRelojContacto, 1000);
  actualizarRelojContacto();

  // Prevención de Memory Leaks y Lógica de la App
  $(document).off('change', '#capa1').on('change', '#capa1', function() {
    let valor = $(this).val();
    let $capa2 = $('#capa2');
    $capa2.html('<option value="">-- Seleccione opción --</option>').prop('disabled', false);
    if (valor === 'pc') {
      $capa2.append('<option value="val">Valorant (Riot)</option>');
      $capa2.append('<option value="cs">CS2 (Steam)</option>');
      $capa2.append('<option value="lol">LoL (Riot)</option>');
    } else if (valor === 'consola') {
      $capa2.append('<option value="ps5">Torneo PS5</option>');
      $capa2.append('<option value="xbox">Torneo Xbox</option>');
    } else {
      $capa2.prop('disabled', true);
    }
    $('#resultadoFiltro').text('Seleccione las capas anteriores...');
  });

  $(document).off('change', '#capa2').on('change', '#capa2', function() {
    let seleccion = $(this).find('option:selected').text();
    if ($(this).val() !== '') {
      $('#resultadoFiltro').text('Selección actual: ' + seleccion);
    } else {
      $('#resultadoFiltro').text('Seleccione las capas anteriores...');
    }
  });

  $(document).off('click', '#menuToggle').on('click', '#menuToggle', function() {
    $('#sidebar').toggleClass('open');
  });

  $(document).off('click', '#btnOpenCart').on('click', '#btnOpenCart', function() {
    $('#sidebar').removeClass('open');
    $('#panelBitacora').removeClass('open'); 
    $('#panelCarrito').addClass('open');
  });

  $(document).off('click', '#btnOpenLog').on('click', '#btnOpenLog', function() {
    $('#sidebar').removeClass('open');
    $('#panelCarrito').removeClass('open'); 
    $('#panelBitacora').addClass('open');
  });

  $(document).off('click', '.close-side-panel').on('click', '.close-side-panel', function() {
    $('#' + $(this).data('close')).removeClass('open');
  });

  $(document).off('click', '#themeBtn').on('click', '#themeBtn', function() {
    $('body').toggleClass('light-mode');
    $(this).html($('body').hasClass('light-mode') ? '☀️' : '🌙');
  });

  $(document).off('click', '.nav-btn').on('click', '.nav-btn', function() {
    $('.nav-btn').removeClass('active');
    $(this).addClass('active');
    const section = $(this).data('section');
    $('.page-section').hide();
    $('#page-' + section).fadeIn(300);
    agregarBitacora('Navegación', `Ingresó a ${section}`);
    if ($(window).width() <= 900) $('#sidebar').removeClass('open');
  });

  $(document).off('change', '#filtroJuegoEquipo').on('change', '#filtroJuegoEquipo', function() {
    const juego = $(this).val();
    $('.equipo-card').each(function() {
      const catCard = $(this).data('juego');
      if (juego === 'todos' || catCard === juego) $(this).show();
      else $(this).hide();
    });
    agregarBitacora('Filtro', `Equipo filtrado por: ${juego}`);
  });

  $(document).off('click', '.accordion-btn').on('click', '.accordion-btn', function() {
    $(this).next('.accordion-panel').slideToggle('fast');
    $(this).toggleClass('abierto');
    agregarBitacora('Acordeón', $(this).text().trim());
  });

  $(document).off('click', '.tema-btn').on('click', '.tema-btn', function() {
    const tema = $(this).data('tema');
    const $seccion = $('#page-torneos');
    $('.tema-btn').removeClass('activo');
    $(this).addClass('activo');
    $seccion.removeClass('tema-valorant tema-cs2 tema-lol');
    $seccion.addClass('tema-' + tema);
    let icono = '🎯', titulo = 'Torneos de Valorant';
    if (tema === 'cs2') { icono = '🔫'; titulo = 'Torneos de CS2'; }
    if (tema === 'lol') { icono = '⚔️'; titulo = 'Torneos de LoL'; }
    $('#temaIcono').html(icono);
    $('#temaTitulo').text(titulo);
    agregarBitacora('Tema', `Cambió a ${tema}`);
  });

  function renderizarTienda() {
    const $grid = $('#tiendaGrid');
    $grid.empty();
    productos.forEach(p => {
      $grid.append(`
        <div class="card">
          <img src="${p.img}" alt="${p.nombre}">
          <div class="card-body">
            <span class="badge">${p.cat}</span>
            <h3>${p.nombre}</h3>
            <p class="price">$${p.precio}</p>
            <button class="btn btn-sm btn-block btn-add-cart" data-id="${p.id}">Añadir</button>
          </div>
        </div>
      `);
    });
  }
  renderizarTienda();

  $(document).off('click', '.btn-add-cart').on('click', '.btn-add-cart', function() {
    const id = $(this).data('id');
    const producto = productos.find(p => p.id === id);
    const existe = carrito.find(item => item.id === id);
    if (existe) { existe.cantidad++; } else { carrito.push({ ...producto, cantidad: 1 }); }
    renderizarCarrito();
    mostrarToast('Añadido', `${producto.nombre} agregado.`);
    $('#panelCarrito').addClass('open'); 
  });

  function renderizarCarrito() {
    const $list = $('#cartList');
    $list.empty();
    if (carrito.length === 0) {
      $list.html('<p class="empty-msg">Carrito vacío</p>');
      $('#cartSubtotal').text('$0.00'); 
      $('#cartEnvio').text('$0.00'); 
      $('#cartTotal').text('$0.00');
      return;
    }
    let subtotal = 0;
    carrito.forEach((item, index) => {
      const sub = item.precio * item.cantidad;
      subtotal += sub;
      $list.append(`
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.nombre}</h4>
            <p>$${item.precio} c/u</p>
            <span class="subtotal">$${sub.toFixed(2)}</span>
          </div>
          <div class="cart-controls">
            <button class="qty-btn btn-restar" data-index="${index}">-</button>
            <span>${item.cantidad}</span>
            <button class="qty-btn btn-sumar" data-index="${index}">+</button>
            <button class="remove-btn btn-eliminar" data-index="${index}">×</button>
          </div>
        </div>
      `);
    });
    const envio = COSTO_ENVIO;
    const total = subtotal + envio;
    $('#cartSubtotal').text(`$${subtotal.toFixed(2)}`);
    $('#cartEnvio').text(`$${envio.toFixed(2)}`);
    $('#cartTotal').text(`$${total.toFixed(2)}`);
  }

  $(document).off('click', '.btn-sumar').on('click', '.btn-sumar', function() {
    carrito[$(this).data('index')].cantidad++;
    renderizarCarrito();
  });
  
  $(document).off('click', '.btn-restar').on('click', '.btn-restar', function() {
    const i = $(this).data('index');
    if (carrito[i].cantidad > 1) carrito[i].cantidad--; else carrito.splice(i, 1);
    renderizarCarrito();
  });
  
  $(document).off('click', '.btn-eliminar').on('click', '.btn-eliminar', function() {
    carrito.splice($(this).data('index'), 1);
    renderizarCarrito();
  });

  function agregarBitacora(tipo, desc) {
    const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    bitacora.unshift({ tipo, desc, hora });
    renderizarBitacora();
  }
  function renderizarBitacora() {
    const $list = $('#logList');
    $list.empty();
    if (bitacora.length === 0) { $list.html('<p class="empty-msg">Sin actividad</p>'); return; }
    bitacora.slice(0, 15).forEach(item => {
      $list.append(`
        <div class="log-item">
          <h4>${item.tipo}</h4>
          <p>${item.desc}</p>
          <span class="log-time">⏱ ${item.hora}</span>
        </div>
      `);
    });
  }

  $(document).off('click', '#btnCheckout').on('click', '#btnCheckout', function() {
    if (carrito.length === 0) { mostrarToast('Vacío', 'Añade productos.'); return; }
    const subtotal = parseFloat($('#cartSubtotal').text().replace('$', ''));
    const envio = parseFloat($('#cartEnvio').text().replace('$', ''));
    const total = parseFloat($('#cartTotal').text().replace('$', ''));
    $('#modalSubtotal').text(`$${subtotal.toFixed(2)}`);
    $('#modalEnvio').text(`$${envio.toFixed(2)}`);
    $('#modalTotal').text(`$${total.toFixed(2)}`);
    $('#modalCheckout').css('display', 'flex').hide().fadeIn(200);
    iniciarTemporizador();
  });

  $(document).off('click', '#closeModal').on('click', '#closeModal', function() { 
    $('#modalCheckout').fadeOut(200); 
    clearInterval(timerInterval);
  });

  function iniciarTemporizador() {
    clearInterval(timerInterval);
    let tiempoRestante = 15; 
    $('#checkoutTimer').text(`${tiempoRestante}s`);
    timerInterval = setInterval(function() {
      tiempoRestante--;
      $('#checkoutTimer').text(`${tiempoRestante}s`);
      if (tiempoRestante <= 0) {
        clearInterval(timerInterval);
        $('#modalCheckout').fadeOut(200);
        mostrarToast('Tiempo agotado', 'El pedido ha expirado.');
      }
    }, 1000);
  }

  $(document).off('input blur', '#checkoutName').on('input blur', '#checkoutName', function() {
    const val = $(this).val().trim();
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (val !== '' && !regex.test(val)) { $(this).addClass('error'); $('#err-checkoutName').show(); }
    else { $(this).removeClass('error'); $('#err-checkoutName').hide(); }
  });

  $(document).off('click', '#btnConfirmOrder').on('click', '#btnConfirmOrder', function() {
    const nombre = $('#checkoutName').val().trim();
    if (!nombre || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      $('#checkoutName').addClass('error'); $('#err-checkoutName').show(); return;
    }
    clearInterval(timerInterval); 
    mostrarToast('¡Pedido Confirmado!', `Gracias ${nombre}.`);
    agregarBitacora('Pedido', `Confirmado por ${nombre} - Total: ${$('#modalTotal').text()}`);
    carrito = []; 
    renderizarCarrito(); 
    $('#modalCheckout').fadeOut(200);
    $('#checkoutName').val('').removeClass('error'); $('#err-checkoutName').hide();
    $('#panelCarrito').removeClass('open');
    $('#btnOpenLog').click(); 
  });

  function mostrarToast(titulo, mensaje) {
    $('#toastTitle').text(titulo); $('#toastMsg').text(mensaje);
    $('#toast').slideDown(300);
    setTimeout(() => $('#toast').fadeOut(300), 3000);
  }

  const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validarCampo($input, $error, condicion) {
    if (!condicion) { $input.addClass('error'); $error.show(); return false; } 
    else { $input.removeClass('error'); $error.hide(); return true; }
  }

  $(document).off('input blur', '#teamName').on('input blur', '#teamName', function() {
    const val = $(this).val().trim();
    validarCampo($(this), $('#err-teamName'), val === '' || regexLetras.test(val));
  });
  $(document).off('input blur', '#teamCaptain').on('input blur', '#teamCaptain', function() {
    const val = $(this).val().trim();
    validarCampo($(this), $('#err-teamCaptain'), val === '' || regexLetras.test(val));
  });
  $(document).off('input blur', '#teamEmail').on('input blur', '#teamEmail', function() {
    const val = $(this).val().trim();
    validarCampo($(this), $('#err-teamEmail'), val === '' || regexEmail.test(val));
  });
  $(document).off('change', '#teamGame').on('change', '#teamGame', function() {
    if ($(this).val() === '') $(this).addClass('error');
    else $(this).removeClass('error');
  });

  $(document).off('submit', '#formInscripcion').on('submit', '#formInscripcion', function(e) {
    e.preventDefault();
    const name = $('#teamName').val().trim();
    const captain = $('#teamCaptain').val().trim();
    const email = $('#teamEmail').val().trim();
    const game = $('#teamGame').val();
    let valido = true;

    if (!regexLetras.test(name)) { $('#teamName').addClass('error'); $('#err-teamName').show(); valido = false; } 
    else { $('#teamName').removeClass('error'); $('#err-teamName').hide(); }
    if (!regexLetras.test(captain)) { $('#teamCaptain').addClass('error'); $('#err-teamCaptain').show(); valido = false; } 
    else { $('#teamCaptain').removeClass('error'); $('#err-teamCaptain').hide(); }
    if (!regexEmail.test(email)) { $('#teamEmail').addClass('error'); $('#err-teamEmail').show(); valido = false; } 
    else { $('#teamEmail').removeClass('error'); $('#err-teamEmail').hide(); }
    if (game === '') { $('#teamGame').addClass('error'); valido = false; } 
    else { $('#teamGame').removeClass('error'); }

    if (!valido) { mostrarToast('Error', 'Revisa los campos marcados.'); return; }
    $('#inscripcionSuccess').text(`✅ Equipo ${name} inscrito (${game}).`).fadeIn();
    agregarBitacora('Inscripción', `Equipo ${name} - ${game} - ${email}`);
    mostrarToast('Éxito', 'Equipo registrado.');
    this.reset();
    $('#teamGame').removeClass('error');
    setTimeout(() => $('#inscripcionSuccess').fadeOut(), 3000);
  });
});