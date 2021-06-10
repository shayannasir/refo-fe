$(document).ready(function() {
    if (IS_ADMIN) {
        if(AUTH_TOKEN && localStorage.getItem(PREFIX + USER.role) === "ADMIN")
            location.href = API.getBaseURL('/admin/dashboard.html');
    }
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

    reqObj.grantType = "DASH_ADMIN";

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
                    location.href = IS_ADMIN ? API.getBaseURL('/admin/dashboard.html') : API.getBaseURL('/dashboard.html');
                }, 2000)
            } else if (data.status === false){
                showAjaxError(data);
            }
        }
    })
})

const saveUserSession = function(data, rememberMe) {
    if (data.token && data.user) {
        if (Object.keys(data.user).length) {
            saveUserToStorage(data);

            if (rememberMe) {
                document.cookie = PREFIX + "authToken=" + data.token + ";" + " max-age=" + COOKIE_LIFE;
                document.cookie = PREFIX + "user=" + data.user.name + ";" + " max-age=" + COOKIE_LIFE;
                document.cookie = PREFIX + "role=" + data.user.role + ";" + " max-age=" + COOKIE_LIFE;
            }
        }
    }
}

const saveUserToStorage = function(data) {
    var user = data.user;
    localStorage.setItem(PREFIX + USER.email, user.email);
    localStorage.setItem(PREFIX + USER.name, user.name);
    localStorage.setItem(PREFIX + USER.isPublished, user.isPublished);
    localStorage.setItem(PREFIX + USER.role, user.role)
    localStorage.setItem(PREFIX + USER.accountEnabled, user.accountEnabled);
    localStorage.setItem(PREFIX + USER.token, data.token);
}
