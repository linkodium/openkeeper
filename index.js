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
				
$("#set_key_btn").click(function(e) {
	e.preventDefault();
	
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
			
			$.ajax({
				method: "POST",
				url: host + "/api/crypt-check/",
				data: { token: localStorage.getItem("token") }
			}).done(function(response) {
				var json = jQuery.parseJSON(response);
				
				if (json.status == "ok"){
					if (json.text == ""){
						$.ajax({
							method: "POST",
							url: host + "/api/crypt-set/",
							data: {
								token: localStorage.getItem("token"),
								control: CryptoJS.AES.encrypt("verified", localStorage.getItem('key')).toString()
							}
						}).done(function(conrol_response) {
							var control_json = jQuery.parseJSON(conrol_response);
							if (control_json.status == "ok"){
								load_data(true);
								$("#modal_key").modal("hide");
							} else {
								Swal.fire({
									icon: 'error',
									title: 'Ошибка',
									html: 'При попытке задать контрольную строку в БД для нового пользователя произошла ошибка. Пожалуйста, пройтите авторизацию повторно.',
									showCancelButton: false,
									confirmButtonText: 'Выход',
								}).then((result) => {
									localStorage.removeItem('key');
									localStorage.removeItem('token');
								});
							}
						});
					} else {
						if (CryptoJS.AES.decrypt(json.text, localStorage.getItem('key')).toString(CryptoJS.enc.Utf8) == "verified"){
							load_data(true);
							$("#modal_key").modal("hide");
						} else {
							Swal.fire(
								'Ошибка',
								'Не удалось распознать контрольную строку. Судя по всему, вы указали некорректный ключ дешифровки',
								'error'
							);
						}
					}
				} else {
					Swal.fire(
						'Ошибка',
						json.text,
						'error'
					);
				}
			});

		}
	});
});


$("#set_new_key_btn").click(function(e) {
	e.preventDefault();
	var old_key = localStorage.getItem("key");
	var new_key = $("#set_new_key").val();
	
	Swal.fire({
		icon: 'info',
		title: 'Подтвердите действие',
		html: 'Вы уверены, что хотите использовать в качестве ключа дешифровки <b>' + $("#set_new_key").val() + '</b> и зашифровать все карточки с помощью этого ключа?',
		showCancelButton: true,
		confirmButtonText: 'Обновить',
		cancelButtonText: 'Отмена'
	}).then((result) => {
		if (result.isConfirmed) {
			
			$(".show_card").each(function( index ) {

				
				$.ajax({
					method: "POST",
					url: host + "/api/data/get/",
					data: {
						token: localStorage.getItem('token'),
						uuid: $(".show_card").eq(index).attr('data-target'),
					}
				}).done(function(response) {
					var json = jQuery.parseJSON(response);
					
					if (json.status != "ok") {
						Swal.fire(
							'Ошибка',
							json.text,
							'error'
						);
					} else {
						var data = CryptoJS.AES.decrypt(json.text.data, old_key).toString(CryptoJS.enc.Utf8);
						var card_name = json.text.name;
						
						$.ajax({
							method: "POST",
							url: host + "/api/data/update/",
							data: {
								token: localStorage.getItem('token'),
								uuid: $(".show_card").eq(index).attr('data-target'),
								name: card_name,
								content: CryptoJS.AES.encrypt(data, new_key).toString()
							}
						}).done(function(response_update) {
							var json_update = jQuery.parseJSON(response_update);
							
							if (json_update.status != "ok") {
								Swal.fire(
									'Ошибка',
									json_update.text,
									'error'
								);
							} else {
								//toastr.success("Информация была успешно обновлена");  
							}
						});
					}
				});
				
				
			});
			
			$.ajax({
				method: "POST",
				url: host + "/api/crypt-set/",
				data: {
					token: localStorage.getItem("token"),
					control: CryptoJS.AES.encrypt("verified", new_key).toString()
				}
			}).done(function(conrol_response) {
				var control_json = jQuery.parseJSON(conrol_response);
				if (control_json.status == "ok"){
					localStorage.setItem("key", new_key);
					load_data(true);
					$("#modal_key_update").modal("hide");
				} else {
					Swal.fire({
						icon: 'error',
						title: 'Ошибка',
						html: 'При попытке задать контрольную строку в БД для нового пользователя произошла ошибка. Пожалуйста, пройтите авторизацию повторно.',
						showCancelButton: false,
						confirmButtonText: 'Выход',
					}).then((result) => {
						localStorage.removeItem('key');
						localStorage.removeItem('token');
					});
				}
			});
		}
	});
});

function load_data(show_toastr = false){
	$.ajax({
		method: "POST",
		url: host + "/api/crypt-check/",
		data: { token: localStorage.getItem("token") }
	}).done(function(crypt_response) {
		var crypt_json = jQuery.parseJSON(crypt_response);
		if (crypt_json.status == "ok"){
			if (CryptoJS.AES.decrypt(crypt_json.text, localStorage.getItem('key')).toString(CryptoJS.enc.Utf8) == "verified"){
				$.ajax({
					method: "POST",
					url: host + "/api/data/list/",
					data: {
						token: localStorage.getItem('token')
					}
				}).done(function(response) {
					var json = jQuery.parseJSON(response);
					if (json.status == "ok"){
						$("#data-container").html("");
						$.each(json.text, function( index, value ) {
							$("#data-container").append('- <a href="#" class="show_card" data-target="' + value.uuid + '">' + value.name + '</a> (изменено: ' + value.updated + ')<br>');
						});
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
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Ошибка',
					html: 'Не удалось распоздать контрольную строку. Скорее всего, вы изменили ключ дешифровки с помощью друого устроства. Для того, чтобы расшифровать данные - укажите актуальный ключ дешифровки.',
					confirmButtonText: 'Изменить',
					allowOutsideClick: false
				}).then((result) => {
					if (result.isConfirmed) {
						$("#modal_key").modal({backdrop:'static', keyboard:false});
						$("#modal_key").modal("toggle");
					}
				});
			}
		}
	});
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
	
	load_data(true);
});
	
$("#key_update").click(function(e) {
	$("#modal_key_update").modal("toggle");
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

$("#add_card").click(function(e) {
	e.preventDefault();
	$("#f_card_uuid").val("");
	$("#f_card_name").val("");
	$("#f_card_content").val("");
	$("#modal_card").modal("toggle");
});

$("#f_card").submit(function(e) {
	e.preventDefault();
	
	$.ajax({
		method: "POST",
		url: host + "/api/data/update/",
		data: {
			token: localStorage.getItem('token'),
			uuid: $("#f_card_uuid").val(),
			name: $("#f_card_name").val(),
			content: CryptoJS.AES.encrypt($("#f_card_content").val(), localStorage.getItem('key')).toString()
		}
	}).done(function(response) {
		var json = jQuery.parseJSON(response);
		if (json.status != "ok") {
			Swal.fire(
				'Ошибка',
				json.text,
				'error'
			);
		} else {
			toastr.success("Информация была успешно обновлена");  
		}
	});
});


$("#data-container").on( "click", ".show_card", function(e) {
	e.preventDefault();
	var uuid = $(this).attr('data-target');
	
	$.ajax({
		method: "POST",
		url: host + "/api/data/get/",
		data: {
			token: localStorage.getItem('token'),
			uuid: uuid,
		}
	}).done(function(response) {
		var json = jQuery.parseJSON(response);
		if (json.status != "ok") {
			Swal.fire(
				'Ошибка',
				json.text,
				'error'
			);
		} else {
			$("#f_card_uuid").val(uuid);
			$("#f_card_name").val(json.text.name);
			$("#f_card_content").val(CryptoJS.AES.decrypt(json.text.data, localStorage.getItem('key')).toString(CryptoJS.enc.Utf8));
			$("#modal_card").modal("toggle");
		}
	});
});