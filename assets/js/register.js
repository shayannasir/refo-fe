const referField = '<div class="col-sm-12 col-md-6"><div class="form-group mt-4"><label for="refer">Referrer Code <span class="deleteField">DELETE</span> </label><input type="text" name="referrerCode" class="form-control" id="refer"></div></div>';

const showFieldError = function(field, error) {
    field.parent().addClass('has-error').append(HELPER.getErrorText(error));
    return false;
}

const showFieldSuccess = function(field, message) {
    field.parent().append(HELPER.getSuccessText(message));
}

const clearFieldMessage = function(field) {
    field.parent().removeClass('has-error').find('p').remove();
}

const showToast = function(status, message) {
    toastr[status](message)  
} 

const verifyEmail = function(field, email) {
    clearFieldMessage(field);
    $('a.cta-otp').addClass('disable-btn');

    if (!email || !email.length || !email.trim().length)
        return showFieldError(field, REQUIRED_FIELD_MSG);
    if (!VALIDATOR.isValidEmail(email))
        return showFieldError(field, INVALID_EMAIL_MSG);
    
        $.ajax({
            beforeSend: showFieldSuccess(field, 'Checking email availability...'),
            type: "GET",
            url: API.getAPIEndPoint("/user/verifyEmail?email=" + email),
            success: function(data) {
                if (data.status === true) {
                    clearFieldMessage(field);
                    showFieldSuccess(field, 'Email is Available');
                    $('a.cta-otp').removeClass('disable-btn');
                } else {
                    clearFieldMessage(field);
                    showFieldError(field, data.message);
                }
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

const verifyPhone = function(field, phone) {
    clearFieldMessage(field);
    if (!phone || !phone.length || !phone.trim().length)
        return showFieldError(field, REQUIRED_FIELD_MSG);
    if (!VALIDATOR.isValidPhone(phone))
        return showFieldError(field, INVALID_PHONE_MSG);
}

const validatePasswords = function(field, pass, confirmPass) {
    clearFieldMessage(field);
    if (pass !== confirmPass || confirmPass.length === 0)
        return showFieldError(field, PASSWORD_NO_MATCH_MSG);
}

const sendOTP = function(field) {
    $('input#email').attr('disabled', true);
    $('a.cta-otp').html('Sending...').addClass('disable-btn');

    var email = $('input#email').val();
    var payload = {
        email: email
    };
    
    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint("/user/generateOTP"),
        data: JSON.stringify(payload),
        headers: {
            "Content-Type": 'application/json'
        },
        success: function(data) {
            if (data.status === true) {
                $('a.cta-otp').html('OTP Sent');
                $('input#otp').removeAttr('disabled');
                // Show toast
            } else {
                $('a.cta-otp').html('SEND OTP');
                $('input#opt').attr('disabled', true);
            }
        },
        error: function() {
            alert("error");
            // show common error toast for all ajax errors
        }
    })
}

const validateRequiredAndBlank = function(field, value) {
    clearFieldMessage(field);
    if (!value || !value.length || !value.trim().length)
        return showFieldError(field, REQUIRED_FIELD_MSG);
    return true;
}

const saveRegistrationDetails = function() {
    var reqObj = {};
    $('input').each(function(index, item) {
        var name = $(item).attr('name');
        var value = $(item).val(); 
        reqObj[name] = value;
    })
    reqObj['name'] = $('input[name=fname]').val() + " " + $('input[name=lname]').val();

    if (Object.keys(reqObj).length) {
        $.ajax({
            type: "POST",
            data: JSON.stringify(reqObj),
            url: API.getAPIEndPoint('/user/register'),
            headers: {
                "Content-Type": 'application/json'
            },
            success: function(data) {
                if (data.status === true) {
                    showToast(TOAST.success, data.message);
                    setTimeout(() => {
                        showToast(TOAST.info, "Redirecting to Login Page...")
                    }, 1000)
                    setTimeout(() => {
                        location.href = API.getBaseURL('/login.html');
                    }, 8000)
                } else if (data.status === false) {
                    if (data.data) {
                        for (const [key, value] of Object.entries(data.data))
                            showToast(TOAST.error, value);
                    } else {
                        showToast(TOAST.error, data.message);
                    }
                }
            }
        })
    }
}

$('input').filter(function() { return !$(this).hasClass('validated')}).on('change focusout', function() {
    validateRequiredAndBlank($(this), $(this).val());
})

$('input#email').on('focusout', function() {
    verifyEmail($(this), $(this).val());
})

$('input#password').on('change focusout', function() {
    verifyPassword($(this), $(this).val());
})

$('input#confirmPassword').on('change focusout', function() {
    var pass = $('input#password').val();
    var confirmPass = $(this).val();
    validatePasswords($(this), pass, confirmPass);
})

$('input#number').on('change focusout', function() {
    verifyPhone($(this), $(this).val());
})

$('a.cta-otp').on('click', function() {
    sendOTP($(this));
})

$('a.refer').on('click', function() {
    if (!$(this).closest('form').find('input#refer').length) {
        $(this).closest('form').find('.form-wrap').append(referField);
    }
})

$(document).on('click', 'span.deleteField', function() {
    $(this).closest('.col-sm-12').remove();
})

$('a.cta-register').on('click', function() {
    var validated = true;

    $('input').each(function(index, item) {
        if (!validateRequiredAndBlank($(item), $(item).val())) {
            validated = false;
        }
    });

    if (validated === true)
        saveRegistrationDetails();
    else
        showToast(TOAST.error, "There are some errors in the form");
});

