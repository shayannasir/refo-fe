$(document).ready(function() {
    if(AUTH_TOKEN)
        location.href = API.getBaseURL('/dashboard.html');
})

$('a.cta-login').on('click', function() {
    var reqObj = {};
    var $emailField = $('input#email');
    var $passField = $('input#password');
    var rememberMe = $('input#rememberMe').is(':checked');

    clearFieldMessage($emailField);
    if (!$emailField.val() || !$emailField.val().length)
        return showFieldError($emailField, REQUIRED_FIELD_MSG);
    if (!VALIDATOR.isValidEmail($emailField.val()))
        return showFieldError($emailField, INVALID_EMAIL_MSG);
    reqObj.email = $emailField.val();

    clearFieldMessage($passField)
    if (!$passField.val() || !$passField.val().length)
        return showFieldError($passField, REQUIRED_FIELD_MSG);
    reqObj.password = $passField.val();

    reqObj.grantType = "USER";

    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint('/user/login'),
        data: JSON.stringify(reqObj),
        success: function(data) {
            if (data.status === true) {
                showToast(TOAST.success, "Login Seccessful");
                saveUserSession(data.data, rememberMe);
                showToast(TOAST.success, "Welcome " + data.data.user.name);
                setTimeout(() => {
                    location.href = API.getBaseURL('/dashboard.html')
                }, 2000)
            } else if (data.status === false){
                showAjaxError(data);
            }
        }
    })
})

$(document).on('focusout', '#forgotPass input#email', function() {
    verifyEmail($(this), $(this).val());
})

$(document).on('click', '#forgotPass .cta-otp', function() {
    sendOTP($(this));
})

$(document).on('focusout', '#forgotPass input#password', function() {
    verifyPassword($(this), $(this).val());
})

$(document).on('focusout', '#forgotPass input#newPassword', function() {
    var pass = $('#forgotPass input#password').val();
    var confirmPass = $(this).val();
    validatePasswords($(this), pass, confirmPass);
})

$(document).on('click', '#forgotPass .cta-forgot', function() {
    var validated = true;

    $('#forgotPass input').each(function(index, item) {
        if (!validateRequiredAndBlank($(item), $(item).val())) {
            validated = false;
        }
    });

    if (validated === true && $('#forgotPass .has-error').length === 0) {
        var reqObj = {};
        reqObj.email = $('#forgotPass input#email').val();
        reqObj.oldPassword = $('#forgotPass input#password').val()
        reqObj.newPassword = $('#forgotPass input#newPassword').val()
        reqObj.otp = $('#forgotPass input#otp').val();
        if(reqObj.oldPassword !== reqObj.newPassword)
            showToast(TOAST.error, PASSWORD_NO_MATCH_MSG);
        else {
            $.ajax({
                type: "POST",
                url: API.getAPIEndPoint('/user/password/change'),
                data: JSON.stringify(reqObj),
                success: function(data) {
                    if (data.status === true) {
                        showToast(TOAST.success, data.message);
                        $('#forgotPass').modal('hide');
                    } else if (data.status === false) {
                        showAjaxError(data);
                    }
                }
            })
        }

    } else
        showToast(TOAST.error, "There are some errors in the form");
})

$("#forgotPass").on('hidden.bs.modal', function () {
    clearForgotPasswordModal($(this));
});

const saveUserSession = function(data, rememberMe) {
    if (data.token && data.user) {
        if (Object.keys(data.user).length) {
            saveUserToStorage(data);

            if (rememberMe) {
                document.cookie = "authToken=" + data.token + ";" + " max-age=" + COOKIE_LIFE;
                document.cookie = "user=" + data.user.name + ";" + " max-age=" + COOKIE_LIFE;
                document.cookie = "role=" + data.user.role + ";" + " max-age=" + COOKIE_LIFE;
            }
        }
    }
}

const saveUserToStorage = function(data) {
    var user = data.user;
    localStorage.setItem(USER.email, user.email);
    localStorage.setItem(USER.name, user.name);
    localStorage.setItem(USER.isPublished, user.isPublished);
    localStorage.setItem(USER.role, user.role)
    localStorage.setItem(USER.accountEnabled, user.accountEnabled);
    localStorage.setItem(USER.token, data.token);
}

const verifyEmail = function(field, email) {
    clearFieldMessage(field);
    $('a.cta-otp').addClass('disable-btn');

    if (!email || !email.length || !email.trim().length)
        return showFieldError(field, REQUIRED_FIELD_MSG);
    if (!VALIDATOR.isValidEmail(email))
        return showFieldError(field, INVALID_EMAIL_MSG);

    $('a.cta-otp').removeClass('disable-btn');
    
    
        // $.ajax({
        //     beforeSend: showFieldSuccess(field, 'Checking email availability...'),
        //     type: "GET",
        //     url: API.getAPIEndPoint("/user/verifyEmail?email=" + email),
        //     success: function(data) {
        //         if (data.status === true) {
        //             clearFieldMessage(field);
        //             showFieldSuccess(field, 'Email is Available');
        //             $('a.cta-otp').removeClass('disable-btn');
        //         } else {
        //             clearFieldMessage(field);
        //             showFieldError(field, data.message);
        //         }
        //     }
        // })
}

const sendOTP = function(field) {
    var $parent = field.closest('#forgotPass');
    $parent.find('input#email').attr('disabled', true);
    $parent.find('a.cta-otp').html('Sending...').addClass('disable-btn');

    var email = $parent.find('input#email').val();
    var payload = {
        email: email
    };
    
    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint("/user/password/forgot"),
        data: JSON.stringify(payload),
        success: function(data) {
            if (data.status === true) {
                $parent.find('a.cta-otp').html('OTP Sent');
                $parent.find('input#otp').removeAttr('disabled');
                $parent.find('.semi-visible').removeClass('display-n');
                showToast(TOAST.success, "OTP sent! Please check your inbox");
            } else if (data.status === false){
                showAjaxError(data)
                $parent.find('input#email').removeAttr('disabled');
                $parent.find('a.cta-otp').html('SEND OTP');
                $parent.find('input#otp').attr('disabled', true);
            }
        },
        error: function() {
            alert("error");
            // show common error toast for all ajax errors
        }
    })
}

const verifyPassword = function(field, pass) {
    clearFieldMessage(field);
    if (!pass || !pass.length || !pass.trim().length)
        return showFieldError(field, REQUIRED_FIELD_MSG);
    if (!VALIDATOR.isValidPassword(pass))
        return showFieldError(field, INVALID_PASSWORD_MSG);
}

const validatePasswords = function(field, pass, confirmPass) {
    clearFieldMessage(field);
    if (pass !== confirmPass)
        return showFieldError(field, PASSWORD_NO_MATCH_MSG);
}

const validateRequiredAndBlank = function(field, value) {
    clearFieldMessage(field);
    if (!value || !value.length || !value.trim().length)
        return showFieldError(field, REQUIRED_FIELD_MSG);
    return true;
}

const clearForgotPasswordModal = function(modal) {
    modal.find('input#email').removeAttr('disabled').val('');
    modal.find('input#otp').attr('disabled', true).val('');
    modal.find('a.cta-otp').addClass('disable-btn').html('SEND OTP');
    modal.find('input#password').val('');
    modal.find('input#newPassword').val('');
    modal.find('.semi-visible').addClass('display-n');
    modal.find('p.error').remove();
}