var documentListObj = {
    sortColumn: "id",
    sortOrder: "desc",
    pageSize: 15,
    pageIndex: 0,
    fetchAllRecords: false,
    searchText: "",
    priority: null
}
var updateObj = {};

const uploadDraftFileHTML = '<td class="action" ><a href="javascript:void(0)" class="draft-upload custom-button custom-button-small">Upload File</a></td>';
const uploadFileHTML = '<td class="action" ><a data-toggle="modal" data-target="#uploadFile" href="javascript:void(0)" class="custom-button custom-button-small">Upload File</a></td>';
const actionItemsHTML = '<td class="action doc-actions icons"><img data-type="yes" class="icon mr-3" src="../assets/icons/check-solid.svg"><img data-type="no" class="icon" src="../assets/icons/times-solid.svg"></td>';
const emptyHTML = '<td class="action"></td>';

var DELAYED = {
    isDelayed: false,
    delayedEndDate: null
}

$(document).ready(function() {
    if (!AUTH_TOKEN)
        location.href = API.getBaseURL('/admin/login.html');
    getDocumentList();
    configureDelayedDate();
})

$('a.cta-logout').on('click', function() {
    logout();
})

$('a.filter').on('click', function() {
    var filter = $(this).attr('data-filter');
    getDocumentList(filter);
})

$(document).on('change', 'input[type=file][name=file]', function() {
    var $target = $(this);
    var type = $(this).attr('data-type');
    var files = $(this).get(0).files[0]
    var formData = new FormData();
    formData.append('file', files);
    if (files) {
        $.ajax({
            type: "POST",
            url: API.getAPIEndPoint('/file/upload'),
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.status === true && data.data) {
                    $target.attr('data-filename', data.data.name);
                    // if (type === "SAMPLE")
                        // $(this).closest('#sampleDoc').find('.file-control').attr('data-filename', data.data.name);
                    // else
                        // documentRegisterObj.file = data.data.name
                    showToast(TOAST.success, FILE_UPLOAD_SUCCESS);
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
})

$(document).on('click', 'span.remove-file', function() {
    $(this).parent().find('input[name=file][type=file]').val('');
})

$(document).on('click', '#uploadDraftFile a.cta-submit', function() {
    var reqObj = {}
    var $target = $(this);
    var $file = $(this).closest('.modal-content').find('input[type=file]');
    var docID = $(this).attr('data-id');
    reqObj['documentID'] = docID;

    if (!$file || !$file.get(0).files[0]) {
        showFieldError($file, REQUIRED_FIELD_MSG);
        // validated = false;
    } else {
        var filename = $file.attr('data-filename');
        reqObj['draft'] = filename;
        if (filename) {
            $.ajax({
                type: "POST",
                url: API.getAPIEndPoint("/admin/document/draft"),
                data: JSON.stringify(reqObj),
                success: function(data) {
                    if (data.status === true) {
                        showToast(TOAST.success, data.message)
                        $target.closest('#uploadDraftFile').modal('hide');
                        setTimeout(()=> {
                            getDocumentList();
                        }, 500)
                    } else if (data.status === false) {
                        showAjaxError(data);
                    }
                }
            })
        }
    }
})

$(document).on('click', '#finalDocUpload a.cta-submit', function() {
    var validated = true;
    var reqObj = {}
    var $target = $(this);
    var $file = $(this).closest('.modal-content').find('input[type=file]');

    clearFieldMessage($file);
    if (!$file || !$file.get(0).files[0]) {
        showFieldError($file, REQUIRED_FIELD_MSG);
        validated = false;
    }

    $target.closest('.modal-content').find('input[type=number]').each(function(index, element) {
        clearFieldMessage($(element));
        var value = $(element).val();
        var regex = new RegExp(/^[0-9]+$/);
        if (!value || value === "") {
            showFieldError($(element), REQUIRED_FIELD_MSG)
            validated = false;
        } else if (!regex.test(value)) {
            showFieldError($(element), PAGE_INVALID);
            validated = false;
        }
        validated = validated && validateFieldRegex($(element), value, $(element).attr('regex'), $(element).attr('regexMessage'));
    })
    if (validated) {
        reqObj['documentID'] = $(this).attr('data-id');
        reqObj['finalDoc'] = $file.attr('data-filename');
        reqObj['progress'] = $target.closest('.modal-content').find('input[name=progress]').val();
        reqObj['finalPages'] = $target.closest('.modal-content').find('input[name=finalPages]').val();

        $.ajax({
            type: "POST",
            url: API.getAPIEndPoint("/admin/document/final"),
            data: JSON.stringify(reqObj),
            success: function(data) {
                if (data.status === true) {
                    showToast(TOAST.success, data.message)
                    $target.closest('#finalDocUpload').modal('hide');
                    setTimeout(()=> {
                        getDocumentList();
                    }, 500)
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
})

$(document).on('click', 'td.draft-upload', function() {
    var docID = $(this).closest('tr').find('th a').html();
    $('#uploadDraftFile').find('.cta-submit').attr('data-id', docID);
    $('#uploadDraftFile').modal('show');
})

$(document).on('click', 'td.draft-feedback', function() {
    var docID = $(this).closest('tr').find('th a').html();
    var draftFile = $(this).attr('data-file');
    $('#draftFeedback').find('.cta-submit').attr('data-id', docID);
    $('#draftFeedback').find('.draft-download').attr('href', API.getAPIEndPoint('/file/download?fileName=' + draftFile));
    $('#draftFeedback').find('textarea').val(localStorage.getItem(docID))
    $('#draftFeedback').modal('show');
})

$(document).on('click', '#draftFeedback .cta-changes', function() {
    var reqObj = {}
    var $target = $(this);
    var $file = $(this).closest('.modal-content').find('input[type=file]');
    var docID = $(this).attr('data-id');
    reqObj['documentID'] = docID;

    if (!$file || !$file.get(0).files[0]) {
        showFieldError($file, REQUIRED_FIELD_MSG);
    } else {
        var filename = $file.attr('data-filename');
        reqObj['draft'] = filename;
        if (filename) {
            $.ajax({
                type: "POST",
                url: API.getAPIEndPoint("/admin/document/draft"),
                data: JSON.stringify(reqObj),
                success: function(data) {
                    if (data.status === true) {
                        showToast(TOAST.success, data.message)
                        $target.closest('#draftFeedback').modal('hide');
                        setTimeout(()=> {
                            getDocumentList();
                        }, 500)
                    } else if (data.status === false) {
                        showAjaxError(data);
                    }
                }
            })
        }
    }

})

$(document).on('click', '#draftFeedback .cta-finalize', function() {
    var docID = $(this).attr('data-id');
    $(this).closest('.modal').modal('hide');
    $('.dashboard-table').find('.' + docID).find('#finalDocUpload').modal('show');
})

$(document).on('click', 'a.sample-submit', function() {
    $target = $(this);
    var $file = $(this).closest('.modal-content').find('input[type=file]');
    if (!$file || !$file.get(0).files[0]) {
        showFieldError($file, REQUIRED_FIELD_MSG);
        validated = false;
    } else if ($file.get(0).files[0].type !== "application/pdf"){
        showFieldError($file, "Sample Format should be PDF only");
    } else {
        var filename = $file.attr('data-filename');
        if (filename) {
            $.ajax({
                type: "POST",
                url: API.getAPIEndPoint("/admin/sample") + "?fileName="+ filename,
                success: function(data) {
                    showToast(TOAST.success, data.message);
                    $file.val('');
                    $target.closest('#sampleDoc').modal('hide');
                }
            })
        }
    }
})  

$(document).on('click', 'td.editable-field', function() {
    $(this).closest('tr').find('#updateDoc').modal('show');
})

$(document).on('click', '#updateDoc a.cta-submit', function() {
    $target = $(this);
    var validated = true;
    var docID = $(this).closest('form').attr('data-id');
    updateObj = {};
    if (validateFields($(this).closest('form'), updateObj)) {
        for (const [key, value] of Object.entries(updateObj)) {
            updateObj[key] = Number(value);
        }
        updateObj['documentID'] = docID;
        $.ajax({
            type: "POST",
            url: API.getAPIEndPoint('/admin/document/update'),
            data: JSON.stringify(updateObj),
            success: function(data) {
                if (data.status === true) {
                    showToast(TOAST.success, data.message)
                    $target.closest('#updateDoc').modal('hide');
                    setTimeout(()=> {
                        getDocumentList();
                    }, 500)
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
    else
        showToast(TOAST.error, ERRORS_IN_FORM)
    
})

$(document).on('hidden.bs.modal', '#updateDoc', function () {
    clearUpdateDocModal($(this));
});

$(document).on('hidden.bs.modal', '#finalDocUpload', function () {
    clearUpdateDocModal($(this));
    $(this).find('input[type=file]').val('')
});

$(document).on('hidden.bs.modal', '#uploadDraftFile', function () {
    $(this).find('input[type=file]').val('')
    $(this).find('p.error').remove();
    $(this).find('.file-control').removeAttr('data-filename');
    $(this).find('.cta-submit').removeAttr('data-id');
});

$(document).on('hidden.bs.modal', '#sampleDoc', function () {
    $(this).find('input[type=file]').val('')
    $(this).find('p.error').remove();
    $(this).find('.file-control').removeAttr('data-filename');
});

$(document).on('hidden.bs.modal', '#draftFeedback', function () {
    $(this).find('input[type=file]').val('')
    $(this).find('textarea').val('');
    $(this).find('p.error').remove();
    $(this).find('.cta-submit').removeAttr('data-id');
    $(this).find('.draft-download').attr('href', 'javascript:void(0)');
    $(this).find('.file-control').removeAttr('data-filename');
});

$('#delayed').on('change', 'input[type=checkbox]', function() {
    if ($(this).is(':checked')) {
        $(this).closest('.modal-content').find('input').removeAttr('disabled')
        $(this).closest('.modal-content').find('a.cta-submit').removeClass('disable-btn')
    } else {
        $(this).closest('.modal-content').find('input').attr('disabled', true)
    }
})

$('#delayed').on('click', '.cta-submit', function() {
    var reqObj = {};
    var $target = $(this);
    var isDelayed = $(this).closest('.modal-content').find('input[type=checkbox]').is(':checked');
    var dateField = $(this).closest('.modal-content').find('input[type=date]').val();
    var timeField = $(this).closest('.modal-content').find('input[type=time]').val();

    if (dateField)
        dateField = dateField.replaceAll("-", ":");
    if (timeField)
        timeField = timeField.substr(0, 5);

    reqObj['isDelayed'] = isDelayed;
    reqObj['dateTime'] = dateField + ":" + timeField;

    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint('/admin/delayed'),
        data: JSON.stringify(reqObj),
        success: function(data) {
            if (data.status === true) {
                showToast(TOAST.success, data.message)
                $target.closest('#delayed').modal('hide');
                setTimeout(() => {
                    location.href = location.href;
                }, 2000)
            } else if (data.status === false) {
                showAjaxError(data);
            }
        }
    })
})

const validateFields = function($parent, obj) {
    var validated = true;

    $parent.find('input, select, textarea').each((index, element) => {
        clearFieldMessage($(element));
        var name = $(element).attr('name');
        var type = $(element).attr('type');
        var regexVal = $(element).attr('regex');

        if (type === 'file') {
            if (!$(element).get(0).files[0]) {
                showFieldError($(element), REQUIRED_FIELD_MSG);
                validated = false;
            } else {
                if (!obj[name] || obj[name] === ""){
                    showFieldError($(element), "Invalid File");
                    validated = false;
                }
            }
        } else if (type === 'select') {
            var value = $(element).val();
            if (!value || value === "") {
                showFieldError($(element), REQUIRED_FIELD_MSG);
                validated = false;
            } else {
                obj[name] = value;
            }
        } else if (type === 'text') {
            var value = $(element).val();
            if (!value || value === "") {
                showFieldError($(element), REQUIRED_FIELD_MSG)
                validated = false;
            } else {
                if (name === "documentName")
                    obj[name] = value;
            }
        } else if (type === 'number') {
            var value = $(element).val();
            var regex = new RegExp(/^[0-9]+$/);
            if (!value || value === "") {
                showFieldError($(element), REQUIRED_FIELD_MSG)
                validated = false;
            } else if (!regex.test(value)) {
                showFieldError($(element), PAGE_INVALID);
                validated = false;
            } else {
                obj[name] = value;
            }
        } else {
            if (name === 'otherServiceType') {
                var value = $(element).val();
                if ($('select[name=serviceType]').val() === "OTHER") {
                    if (!value || value === "") {
                        showFieldError($(element), REQUIRED_FIELD_MSG);
                        validated = false;
                    } else {
                        documentRegisterObj.otherServiceType = value;
                    }
                }
            } else if (name === 'additionalInformation') {
                var value = $(element).val();
                if (value)
                    documentRegisterObj.additionalInformation = value;
            }
        }

        validated = validated && validateFieldRegex($(element), value, regexVal, $(element).attr('regexMessage'));

    })
    return validated;
}

const validateFieldRegex = function(field, value, regexVal, msg) {
    if (regexVal) {
        var regex = new RegExp(regexVal);
        var msg = field.attr('regexMessage');
        if (!regex.test(value)) {
            showFieldError(field, msg);
            return false;            
        }
    }
    return true;
}

const getDocumentList = function(filter) {

    documentListObj.priority = filter;

    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint('/document/list'),
        data: JSON.stringify(documentListObj),
        success: function(data) {
            if (data.status === true || data.status === false) {
                $('.dashboard-table tbody').html('');
                $('.count').html("Total Count: " + data.recordsFiltered);
                if (data.data) {
                    var $body = $('.dashboard-table tbody');
                    var documents = data.data;
                    documents.forEach(element => {
                        var paymentStatus = PAY_STATUS[element.paymentStatus];
                        var status = DOC_STATUS[element.status];
                        var documentName = truncateString(element.documentName, 20);
    
                        var uploadDate = new Date(element.uploadDate);
                        uploadDate = uploadDate.toLocaleDateString().replaceAll("/", "-");

                        var isDraftFeedback = element.status === STATUS.draft && element.notifyUser === false;
                        if (isDraftFeedback)
                            localStorage.setItem(element.documentID, element.feedback);

                        var isEditableField = false;

                        var editNumbersModalData = ` <div class="modal fade" id="updateDoc" tabindex="-1" aria-labelledby="uploadDocRegularLabel" aria-hidden="true"> <div class="modal-dialog modal-dialog-centered custom-modal-width"> <div class="modal-content card custom-modal-container"> <div class="d-flex justify-content-between mb-4"> <h5 class="modal-title" id="uploadDocRegularLabel">Update Document Details</h5> <button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span class="cross" aria-hidden="true">&times;</span> </button> </div><p class="docTitle">Document ID: <span>${element.documentID}</span></p> <form data-id="${element.documentID}"> <div class="row"> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Progress</label> <input type="number" value="${element.progress}" class="form-control" regex="^[0-9]{1,3}$" regexMessage="Please enter valid percentage" name="progress"> </div> </div> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Tentative Pages</label> <input type="number" value="${element.tentativePages}" class="form-control" name="tentativePages"> </div> </div> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Final Pages</label> <input type="number" class="form-control" value="${element.finalPages}" name="finalPages"> </div> </div> </div> <a class="custom-button pull-right cta-submit" href="javascript:void(0)">Confirm</a> </form> </div> </div> </div>`;

                        var finalUploadModal = ` <div class="modal fade" id="finalDocUpload" tabindex="-1" aria-labelledby="uploadFileLabel" aria-hidden="true"> <div class="modal-dialog modal-dialog-centered custom-modal-width"> <div class="modal-content card custom-modal-container"> <div class="d-flex justify-content-between mb-4"> <h5 class="modal-title" id="uploadFileLabel">Upload File</h5> <button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span class="cross" aria-hidden="true">&times;</span> </button> </div> <div class="d-flex file-group"> <input type="file" class="form-control file-control" name="file" data-type="SAMPLE"> <span class="remove-file">X</span> </div> <div class="row"> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Progress</label> <input type="number" value="${element.progress}" class="form-control" regex="^[0-9]{1,3}$" regexMessage="Please enter valid percentage" name="progress"> </div> </div> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Tentative Pages</label> <input type="number" value="${element.tentativePages}" class="form-control" name="tentativePages" disabled readonly> </div> </div> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Final Pages</label> <input type="number" class="form-control" value="${element.finalPages}" name="finalPages"> </div> </div> <div class="row my-4"> <div class="col-sm-12 col-md-9"> <div class="d-flex"> <i class="mr-2 fa fa-info-circle fa-2x" aria-hidden="true"></i> <p class="info" style="line-height: 1.15rem;">By clicking Send, the uploaded documents will be delivered to the respective customer’s registered email.</p> </div> </div> <div class="col-sm-12 col-md-3"> <a href="javascript:void(0)" class="custom-button pull-right cta-submit" data-id="${element.documentID}">Confirm</a> </div> </div> </div> </div> </div>`;

                        var rowData = `<tr class="${element.documentID}"> <th class="${element.notifyUser !== true ? "notify" : ""}" scope="row"><a title="Click to download original Document" href="${API.getAPIEndPoint('/file/download?fileName=' + element.file.name)}">${element.documentID}</a></th> <td class="truncate" title="${element.documentName}">${documentName}</td> <td class="" ><span>${element.progress}%</span></td> <td class="${isEditableField === true ? "editable editable-field": ""}" title="${isEditableField === true ? "Click to Update" : ""}" ><span>${element.tentativePages}</span></td> <td class="" ><span>${element.finalPages}</span></td> <td>${element.userEmail}</td> <td data-toggle="modal" data-target="#paymentInfo" class="payment${element.paymentStatus} font-weight-bold payments">${paymentStatus}</td> <td data-toggle="modal" data-file="${isDraftFeedback && element.firstPage && element.firstPage.name ? element.firstPage.name : ""}" class="${isDraftFeedback ? "draft-feedback" : ""} ${element.status === STATUS.accepted ? 'draft-upload': ""} status" data-target="#doc${element.status}">${status}</td></tr>`;
    
                        $body.append(rowData);
                        $body.find('tr').last().append(editNumbersModalData);
                        $body.find('tr').last().append(finalUploadModal);

                    });
                }
            } 

        }
    })
}

const truncateString = function(text, length) {
    if (text.length > length) {
        text = text.substr(0, length) + "...";
    }
    return text;
}

const clearUpdateDocModal = function(modal) {
    modal.find('input[type=number]').each((index, item) => {
        var value = $(item).attr('value');
        $(item).val(value);
    })

    modal.find('p.error').remove();
}

const configureDelayedDate = function() {
    var ufDate = new Date();
    var currentDate = formatDateForHTML(ufDate);
    var currentTime = ufDate.getHours() + ":" + ufDate.getMinutes();
    $('#delayed').find('input[type=date]').attr('min', currentDate);
    $('#delayed').find('input[type=time]').attr('min', currentTime);

    fetchDelayed();
}

const fetchDelayed = function() {
    $.ajax({
        type: "GET",
        url: API.getAPIEndPoint('/admin/get/delayed'),
        async: false,
        success: function(data) {
            if (data) {
                DELAYED.isDelayed = data.isDelayed;
                DELAYED.delayedEndDate = data.delayedEndDate

                if (data.isDelayed) {
                    $('#delayed').find('input[type=checkbox]').get(0).checked = true;
                    $('#delayed').find('input[type=checkbox]').trigger('change')
                    if (data.delayedEndDate) {
                        var delayDate = new Date(data.delayedEndDate);
                        $('#delayed').find('input[type=date]').val(formatDateForHTML(delayDate));
                        var delayTime = delayDate.toString().split(" ")[4];
                        $('#delayed').find('input[type=time]').val(delayTime);
                    }
                }
            }
        }
    })
}

const formatDateForHTML = function(date) {
    var oldDate = new Date(date);
    var temp = oldDate.toLocaleDateString().split('/');
    var newDate = temp[2] + '-' + temp[1] + '-' + temp[0];
    return newDate;
}