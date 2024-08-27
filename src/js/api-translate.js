const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const uiLocaleParam = urlParams.get("ui_locales");

const translationMappings = {
  es: {
    "this is an API error message": "este es un mensaje de error de la API",
  },
  hi: {
    "this is an API error message": "यह एक एपीआई त्रुटि संदेश है",
  },
};

$(document).ready(function () {
  var target = document.querySelector("#claimVerificationServerError");
  var observer = new MutationObserver(function (mutations) {
    if (uiLocaleParam === null || uiLocaleParam != "en") {
      let tlSet = translationMappings[uiLocaleParam];
      if (!tlSet) {
        return;
      }

      let tlValue = tlSet[target.innerText];
      if (!tlValue) {
        tlValue = target.innerText;
      }

      console.log(tlValue);
      $(target).hide();

      let customTlEl = $("#customTranslationError");
      if (customTlEl.length) {
        customTlEl.innerText = tlValue;
      } else {
        jQuery("<div>", {
          id: "customTranslationError",
          class: "error pagelevel",
          ariaHidden: false,
          role: "alert",
          ariaLive: "polite",
          tabindex: 1,
          text: tlValue,
        }).prependTo("#attributeVerification");
      }
    }
  });

  observer.observe(target, {
    attributes: false,
    childList: true,
    characterData: false,
  });
});
