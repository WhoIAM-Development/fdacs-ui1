let selectedTplKeyPrefix = 'b2c-localdev-selected-tpl'
let originalApiEl = '<div id="api"></div>';
let caret = '<span class="caret"></span>';

$(document).ready(async function() {
  let pageTitle = getPageTitle(false);
  let templateMapSettings = window?.SETTINGS?.templateMapping[pageTitle];
  let pageFilteredTemplates = new Set(templateMapSettings);

  //Dropdown list loading
  let linksHtml = getTemplateLinksHtml(pageTitle, pageFilteredTemplates);
  $("#template-select").append(linksHtml);

  //Apply previously selected template
  let selectedTpl = localStorage.getItem(getLocalStorageTplKeyName());
  if(selectedTpl) {
    let data = JSON.parse(selectedTpl);
    let html = await getTemplateFromUrl(data.url);
    replaceApiHtml(html);
    $("#dropdown-label").html(data.title + caret);
  }

  //Attach an event listener to replace the template
  $("#template-select li").on('click', async function() {
    let pageTitle = getPageTitle(false);
    let url = $(this).data('source');
    let html = await getTemplateFromUrl(url);
    let title = $(this).html();
    replaceApiHtml(html);
    $("#dropdown-label").html(title + caret);
    localStorage.setItem(getLocalStorageTplKeyName(), JSON.stringify({
      url: url,
      title: title
    }));
  });

  //Clear template action
  $("#clear-template").on('click', function() {
    $("#api").replaceWith(originalApiEl);
    $("#dropdown-label").html(window.SETTINGS.defaultDropdownText + caret);
    localStorage.removeItem(getLocalStorageTplKeyName());
  });

  // Keyboard shortcut for showing/hiding the navbar
  // Blocks the "go to search bar" hotkey in Chrome ¯\_(ツ)_/¯
  document.addEventListener('keydown', function(e) {
    if(e.ctrlKey && e.key === 'k') {
      $("nav").toggle();
      e.preventDefault();
    }
  })
});

function getTemplateLinksHtml(pageTitle, pageFilteredTemplates) {
  let links = getDevTemplates();
  let linksHtml = "";
  if(pageFilteredTemplates.size === 0) {
    console.warn(`No template mapping found.  To filter dev templates, please add a key for page \"${pageTitle}\" in the settings file.`)
  }

  for(const link of links) {
    let name = getTemplateName(link);
    if(pageFilteredTemplates.size === 0) {
      linksHtml += `<li data-source=${link}><span>${name}</span></li>`
    }
    else {
      if(pageFilteredTemplates.has(name) || pageFilteredTemplates.has('*')) {
        linksHtml += `<li data-source=${link}><span>${name}</span></li>`
      }
    }
  }

  return linksHtml;
}

function getDevTemplates() {
  let result = new Set();
  $.ajax({
    url: '/devTemplates',
    dataType: 'html',
    async: false,
    success: function(html) {
      let links = new Set();
      $(html).find("#files").find("a.icon-text-html").each(function() {
        links.add($(this)[0].href);
      });
      result = links;
    },
  });

  return result;
}

function getLocalStorageTplKeyName() {
  return selectedTplKeyPrefix + "-" + getPageTitle();
}

async function replaceApiHtml(html) {
  if(!document.getElementById("api")) {
    $(".panel-body").append('<div id="api"></div>');
  }
  $("#api").replaceWith(html);
}

async function getTemplateFromUrl(url) {
  const html = (await (await fetch(url)).text()); // html as text
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return doc.body.firstChild;
}

function getTemplateName(fileUrl) {
  let file = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
  let fileTitle = file.substring(0, fileUrl.lastIndexOf(".html"));

  return fileTitle;
}

//TODO: cache this value somewhere
function getPageTitle(keepExtension = false) {
  let title = "";
  let titleWithExtension = window.location.pathname.split('/')[1];
  if(!keepExtension) {
    title = titleWithExtension.split('.')[0];
  }

  return title;
}
