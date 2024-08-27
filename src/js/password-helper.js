// Password show/hide feature for unified and set/change password page.
const passwordInputSelector = 'input[type="password"]';

$(document).ready(function () {
  waitForElm(passwordInputSelector).then((elm) => applyRules());
});

function applyRules() {
  passwordToggleVisibility();
  passwordValidations();
}

function passwordToggleVisibility() {
  if ($(passwordInputSelector)[0]) {
    $(passwordInputSelector).after(
      '<span class="password-toggle notshown"></span>'
    );

    $(".password-toggle").click(function (e) {
      var target = e.currentTarget;

      $(target).hasClass("shown")
        ? hidePassword($(target))
        : showPassword($(target));
    });

    function hidePassword(e) {
      e.removeClass("shown").addClass("notshown");
      e.prev("input").attr("type", "password");
    }

    function showPassword(e) {
      e.removeClass("notshown").addClass("shown");
      e.prev("input").attr("type", "text");
    }
  }
}

function passwordValidations() {
  var $target = $("#newPassword");
  // Template defined in html to allow localization
  var $template = $("#template-password-rules").contents();

  if (!$target[0] || !$template) {
    return;
  }

  $target.parent().after($template.clone());

  $target
    .parent()
    .siblings(".error.itemLevel")
    .attr("style", "display:none!important");

  var $passwordRules = $(".password-rules");
  $target.focus(() => {
    $passwordRules.show();
  });
  $target.blur(() => {
    $passwordRules.hide();
  });
  $target.on("input", (e) => checkPassword(e, $passwordRules));
  //$('#otherMail').on('input', checkPassword);
}

let operators = {
  '===': function (a, b) { return a === b; },
  '==': function (a, b) { return a == b; },
  '<=': function (a, b) { return a <= b; },
  '>=': function (a, b) { return a >= b; },
  '<': function (a, b) { return a < b; },
  '>': function (a, b) { return a > b; }
};

//TODO: Extract this into a JSON config and load it here somehow
let rules = {
  "length" : {
    "class": ".length",
    "pattern": '^.{8,64}$',
    "category": "length"
  },
  "uppercase": {
    "class": ".uppercase",
    "pattern": '[A-Z]',
    "category": "character"
  },
  "lowercase": {
    "class": ".lowercase",
    "pattern": "[a-z]",
    "category": "character"
  },
  "number": {
    "class": ".number",
    "pattern": '\\d',
    "category": "character"
  },
  "special": {
    "class": ".special",
    "pattern": '[@#$%^&*()_+=[\\]{}|\\\\,.?:;\'\"!\\-]',
    "category": "character"
  }
}

let metaRules = {
  "matchingCharGroups": {
    "class": ".any-three",
    "targetCategory": "character",
    "operation": ">=",
    "count": 3
  }
}

let regexCache = new Map();

function getOrAddRegex(key, regexStr) {
  if(regexCache.has(key)) {
    return regexCache.get(key);
  }
  var value = new RegExp(regexStr);
  regexCache.set(key, value);

  return value;
}

// Any change to the following conditions should be synced in the B2CPolicies' password regex. Update the regex for newPassword claim in B2CPolicies to reflect any password complexity changes.
function checkPassword(e, $passwordRules) {
  var passwordString = e.target.value;

  // Compute constraints
  var constraints = [rules.length, rules.uppercase, rules.lowercase, rules.number, rules.special];
  var results = constraints.map(function(rule) {
    let ruleRegex = getOrAddRegex(rule.class, rule.pattern);
    let ruleResult = {
      ...rule,
      "match": ruleRegex.test(passwordString)
    };
    ApplyRegexRule($passwordRules, ruleResult);

    return ruleResult;
  });

  // Compute meta-constraints that require previous constraint results
  var metaConstraints = [metaRules.matchingCharGroups];
  metaConstraints.forEach(function(rule) {
    let count = results.filter(r => r.category == rule.targetCategory && r.match)?.length ?? 0;
    ApplyMetaRule($passwordRules, rule, count);
  })
}

function isPasswordEqualToEmail(passwordString) {
  if (
    passwordString?.toLowerCase() ==
    $("#emailVerifiedReadonly").val()?.toLowerCase()
  ) {
    return true;
  }
  if (passwordString?.toLowerCase() == $("#otherMail").val()?.toLowerCase()) {
    return true;
  }
  if (
    passwordString?.toLowerCase() ==
    $("#otherMailReadonly").val()?.toLowerCase()
  ) {
    return true;
  }

  return false;
}

function ApplyMetaRule(container, rule, count) {
  let operatorPredicate = operators[rule.operation](count, rule.count);
  ApplyRuleClass(container.find(rule.class), operatorPredicate);
}

function ApplyRegexRule(container, rule) {
  ApplyRuleClass(container.find(rule.class), rule.match);
}

function ApplyRuleClass(ruleElement, ruleResult, classConfig = { valid: "valid", invalid: "invalid" }) {
  if(ruleResult) {
    ruleElement.removeClass(classConfig.invalid).addClass(classConfig.valid);
  } else {
    ruleElement.removeClass(classConfig.valid).addClass(classConfig.invalid);
  }
}

function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
