const host = "https://app.openkeeper.ru";

toastr.options = {
	"closeButton": true,
	"debug": false,
	"newestOnTop": false,
	"progressBar": true,
	"positionClass": "toast-top-right",
	"preventDuplicates": false,
	"onclick": null,
	"showDuration": "300",
	"hideDuration": "1000",
	"timeOut": "3000",
	"extendedTimeOut": "1000",
	"showEasing": "swing",
	"hideEasing": "linear",
	"showMethod": "fadeIn",
	"hideMethod": "fadeOut"
};

$(".btn_sign_up").click(function() {
	$('.form_sign_in').fadeOut('fast');
	$('.form_restore').fadeOut('fast');
	setTimeout(() => {
		$('.form_sign_up').fadeIn('medium');
	}, 200)
});

$(".btn_sign_in").click(function() {
	$('.form_sign_up').fadeOut('fast');
	$('.form_restore').fadeOut('fast');
	setTimeout(() => {
		$('.form_sign_in').fadeIn('medium');
	}, 200)
});
    
$(".btn_restore").click(function() {
	$('.form_sign_up').fadeOut('fast');
	$('.form_sign_in').fadeOut('fast');
	setTimeout(() => {
		$('.form_restore').fadeIn('medium');
	}, 200)
});
    
$("#f_sign_up").submit(function(e) {
	e.preventDefault();
	
	if ($("#f_sign_up input[name='password']").val() != $("#f_sign_up input[name='confirm']").val()) {
		Swal.fire(
			'Ошибка',
			'Введенные вами пароли не совпадают',
			'error'
		);
	} else {
		$.ajax({
			method: "POST",
			url: host + "/api/auth/sign-up/",
			data: $(this).serialize()
		}).done(function(response) {
			if (response != "ok") {
				Swal.fire(
					'Ошибка',
					response,
					'error'
				);
			} else {
				Swal.fire(
					'Отлично',
					'Ваш аккаунт успешно зарегистрирован.',
					'success'
				).then((result) => {
					$('.form_sign_up').fadeOut('fast');
					$('.form_restore').fadeOut('fast');
					setTimeout(() => {
						$('.form_sign_in').fadeIn('medium');
					}, 200)
				});
			}
		});
	}
});

$("#f_sign_in").submit(function(e) {
	e.preventDefault();
	
	$.ajax({
		method: "POST",
		url: host + "/api/auth/sign-in/",
		data: $(this).serialize()
	}).done(function(response) {
		var json = jQuery.parseJSON(response);
		
		if (json.status != "ok") {
			Swal.fire(
				'Ошибка',
				json.data,
				'error'
			);
		} else {
			localStorage.setItem('token', json.data);
			$("#modal_key").modal({backdrop:'static', keyboard:false});
			$("#modal_key").modal("toggle");
			$('#auth_container').fadeOut('fast')
			setTimeout(() => {
				$('#main_container').fadeIn('medium');
			}, 200)
		}
	});
});

$("#f_restore").submit(function(e) {
	e.preventDefault();
	
	$.ajax({
		method: "POST",
		url: host + "/api/auth/restore/",
		data: $(this).serialize()
	}).done(function(response) {
		if (response != "ok") {
			Swal.fire(
				'Ошибка',
				response,
				'error'
			);
		} else {
			Swal.fire(
				'Отлично',
				'На ваш адрес электронной почты была отправлена ссылка на восстановление пароля',
				'success'
			);
			$('.form_restore').fadeOut('fast')
			setTimeout(() => {
				$('.form_sign_in').fadeIn('medium');
			}, 200)
		}
	});
});

$("#set_key_btn").click(function() {
	Swal.fire({
		icon: 'info',
		title: 'Подтвердите действие',
		html: 'Вы уверены, что хотите использовать в качестве ключа дешифровки <b>' + $("#set_key").val() + '</b>?',
		showCancelButton: true,
		confirmButtonText: 'Сохранить',
		cancelButtonText: 'Отмена'
	}).then((result) => {
		if (result.isConfirmed) {
			localStorage.setItem('key', $("#set_key").val());
			$("#modal_key").modal("hide");
			load_data(true);
		}
	});
});

function load_data(show_toastr = false){
	$.ajax({
		method: "POST",
		url: host + "/api/data/get/",
		data: {
			token: localStorage.getItem('token')
		}
	}).done(function(response) {
		var json = jQuery.parseJSON(response);
		if (json.status == "ok"){
			$("#user_data").val(CryptoJS.AES.decrypt(json.text, localStorage.getItem('key')).toString(CryptoJS.enc.Utf8));
		} else {
			Swal.fire(
				'Ошибка',
				json.text,
				'error'
			);
			
			localStorage.removeItem('key');
			localStorage.removeItem('token');
			
			$('#main_container').fadeOut('fast')
			setTimeout(() => {
				$('#auth_container').fadeIn('medium');
			}, 200);
		}
	});
	
	if (show_toastr == true){
		toastr.success("Информация была успешно загружена");  
	}
}

if ((localStorage.getItem('token') !== null) && (localStorage.getItem('key') !== null)){
	$("#auth_container").css("display", "none");
	$("#main_container").css("display", "block");
}

$(document).ready(function() {
	if ((localStorage.getItem('token') !== null) && (localStorage.getItem('key') !== null)){
		load_data();
	} else {
		localStorage.removeItem('key');
		localStorage.removeItem('token');
	}
});

$("#data_save").click(function(e) {
	e.preventDefault();
	
	$.ajax({
		method: "POST",
		url: host + "/api/data/update/",
		data: {
			token: localStorage.getItem('token'),
			data: CryptoJS.AES.encrypt($("#user_data").val(), localStorage.getItem('key')).toString()
		}
	}).done(function(response) {
		var json = jQuery.parseJSON(response);
		if (json.status == "ok"){
			toastr.success("Информация успешно сохранена");
		} else {
			Swal.fire(
				'Ошибка',
				json.text,
				'error'
			);
		}
	});
});

$("#data_load").click(function(e) {
	e.preventDefault();
	
	Swal.fire({
		icon: 'info',
		title: 'Подтвердите действие',
		html: 'Вы пытаетесь получить информацию с сервера. Если вы внесли какие-то изменения без сохранения - они будут утрачены. <br><br>Вы уверены, что хотите произвести синхронизацию с сервером?',
		showCancelButton: true,
		confirmButtonText: 'Синхронизировать',
		cancelButtonText: 'Отмена'
	}).then((result) => {
		if (result.isConfirmed) {
				load_data(true);
		}
	});
});
	
$("#key_update").click(function(e) {
	$("#modal_key").modal("toggle");
});

$("#logout").click(function(e) {
	e.preventDefault();
	
	Swal.fire({
		icon: 'info',
		title: 'Подтвердите действие',
		html: 'Вы уверены, что хотите удалить авторизационные данные с устройства?',
		showCancelButton: true,
		confirmButtonText: 'Выйти',
		cancelButtonText: 'Отмена'
	}).then((result) => {
		if (result.isConfirmed) {
			localStorage.removeItem('key');
			localStorage.removeItem('token');
			
			$('#main_container').fadeOut('fast');
			setTimeout(() => {
				$('#auth_container').fadeIn('medium');
			}, 200);
		}
	});
});

function user_data_resize(){
	$("#data-container").css("height", $(document).height() - $("#toolbar").height() - 80);
}

$(window).resize(function() {
	user_data_resize();
});

$(document).ready(function() {
	user_data_resize();
});