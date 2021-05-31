function copyToClipboard() {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(".referral").text()).select();
  $temp.focus();
  document.execCommand("copy", false, $temp.val());
  $temp.remove();
  $(".copyCode").text("Copied");
}
$(document).ready(function () {
  $(".type").click(function () {
    $("#uploadDoc").modal("hide");
    $("#uploadDocRegular").modal({
      focus: true,
    });
  });
});
