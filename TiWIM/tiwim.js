'use strict';
class TiwimElement {

  static serialize(el) {
    let attributes = [];
    for (var i = 0, atts = el.attributes, n = atts.length; i < n; i++) {
      attributes.push({ name: atts[i].nodeName, value: atts[i].value });
    }
    return {
      tagName: el.tagName,
      outerHTML: el.outerHTML,
      innerHTML: el.innerHTML,
      attributes: attributes
    };
  }

  static deserialize(data) {
    let el = document.createElement('div');
    el.innerHTML = data.outerHTML;
    return el.firstChild;
  }

  static getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }

  static getElementXPath(elt) {
    let path = "";
    for (; elt && elt.nodeType === 1; elt = elt.parentNode) {
      let idx = TiwimElement.getElementIdx(elt);
      let xname = elt.tagName;
      if (idx > 1) xname += "[" + idx + "]";
      path = "/" + xname + path;
    }

    return path;
  }

  static getElementIdx(elt) {
    let count = 1;
    for (let sib = elt.previousSibling; sib; sib = sib.previousSibling) {
      if (sib.nodeType === 1 && sib.tagName === elt.tagName) count++
    }
    return count;
  }

}

class TiwimAction {

  constructor(action, el, beforeState, newState, extra, props) {
    this.action = action;
    this.el = el;
    this.el_data = TiwimElement.serialize(el);
    this.beforeState = beforeState;
    this.newState = newState;
    this.extra = extra;
    if (extra && extra.nodeType === 1) {
      this.extra_data = TiwimElement.serialize(extra);
    }
    this.props = props;
    this.xpath_element = TiwimElement.getElementXPath(el);
    this.xpath_parent = TiwimElement.getElementXPath(extra);
  }

  undo() {
    alert('Necessário implementar!')
  }

  getElKind() {
    if (!this.el) {
      return undefined;
    }
    if (this.el.tagName === 'p') {
      return 'Texto';
    }
    switch (this.el.tagName.toLowerCase()) {
      case 'p':
      case 'span':
        return 'Texto';
      case 'div':
        return 'Área';
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return 'Título';
      case 'a':
        return 'Link';
      default:
        return this.el.tagName;
    }
  }

  getTitle() {
    alert('Necessário implementar!')
  }

  getContent() {
    alert('Necessário implementar!')
  }
}

class EditTiwimAction extends TiwimAction {

  constructor(el, beforeState, newState, extra) {
    super('edit', el, beforeState, newState, extra);
  }

  undo() {
    this.el.innerText = this.beforeState;
  }

  getTitle() {
    return 'Alterar Texto';
  }

  getContent() {
    return `Elemento: ${this.getElKind()}
    Conteúdo: De "${this.beforeState}" para "${this.newState}"
    `;
  }
}

class CutTiwimAction extends TiwimAction {

  constructor(el, beforeState, newState, extra) {
    super('cut', el, beforeState, newState, extra);
  }

  getTitle() {
    return 'Cortar';
  }

  getContent() {
    return `Elemento: ${this.getElKind()}`;
  }

  undo() {
    this.extra.innerHTML = this.beforeState;
  }
}

class PasteTiwimAction extends TiwimAction {

  constructor(el, beforeState, newState, extra) {
    super('paste', el, beforeState, newState, extra);
  }

  undo() {
    this.extra.innerHTML = this.beforeState;
  }

  getTitle() {
    return 'Colar';
  }

  getContent() {
    return `Elemento: ${this.getElKind()}`;
  }
}

class CreateElementTiwimAction extends TiwimAction {

  constructor(el, beforeState, newState, extra) {
    super('create-element', el, beforeState, newState, extra);
  }

  undo() {
    this.extra.innerHTML = this.beforeState;
  }

  getTitle() {
    return 'Adicionar elemento';
  }

  getContent() {
    return `Elemento: ${this.getElKind()}`;
  }
}

class DeleteTiwimAction extends TiwimAction {

  constructor(el, beforeState, newState, extra) {
    super('delete', el, beforeState, newState, extra);
  }

  undo() {
    this.extra.innerHTML = this.beforeState;
  }

  getTitle() {
    return 'Remover';
  }

  getContent() {
    return `Elemento: ${this.getElKind()}`;
  }
}

class CommentTiwimAction extends TiwimAction {

  constructor(el, beforeState, newState, extra) {
    super('comment', el, beforeState, newState, extra);
  }

  undo() {
    this.el.classList.remove('hasComment');
  }

  getTitle() {
    return 'Comentário';
  }

  getContent() {
    return `Elemento: ${this.getElKind()}
    Conteúdo: ${this.extra}`;
  }
}

class Tiwim {

  constructor() {
    const baseSelector = '*:not(#tiwim-tool-area) ';

    this.isActive = true;
    this.excludeSelectors = '#tiwim-tool-area *, #tiwim-tool-area, #tiwimFloatMenu, #tiwimFloatMenu *';
    this.currentElement = null;
    this.currentElementData = null;
    this.elementSelectors = 'div,p,a,li,h1,h2,h3,h4,h5,h6,button,span';
    this.elementSelectors = this.elementSelectors.split(',').map(value => baseSelector + value).join(',');
    this.actions = [];
  }

  reloadChangesPanel() {
    let panel = document.querySelector('#tiwim-tool-area .changes-content');
    panel.innerHTML = '';

    let idx = 1;
    if (this.actions.length === 0) {
      let itemContainer = document.createElement('div');
      itemContainer.classList.add('item');

      let itemTitle = document.createElement('span');
      itemTitle.innerText = 'Sem alterações até o momento.';
      itemTitle.classList.add('title');

      let itemContent = document.createElement('span');
      itemContent.innerText = 'Clique com o botão direito para realizar alterações nos itens da tela.';
      itemContent.classList.add('content');

      itemContainer.appendChild(itemTitle);
      itemContainer.appendChild(itemContent);

      panel.appendChild(itemContainer);
    }

    document.querySelectorAll('.tiwim-has-change').forEach((item) =>
      item.classList.remove('tiwim-has-change'));

    this.actions.forEach((item) => {
      let itemContainer = document.createElement('div');
      itemContainer.classList.add('item');

      let itemTitle = document.createElement('span');
      itemTitle.innerText = '#' + idx + ' - ' + item.getTitle();
      itemTitle.classList.add('title');

      let itemContent = document.createElement('span');
      itemContent.innerText = item.getContent();
      itemContent.classList.add('content');

      itemContainer.appendChild(itemTitle);
      itemContainer.appendChild(itemContent);

      panel.appendChild(itemContainer);
      idx += 1;

      if (!!item.el) {
        console.log(item.el);
        item.el.classList.add('tiwim-has-change');
      }
    });
  }

  registerAction(action) {
    this.actions.push(action);
    this.reloadChangesPanel();
  }


  undoLast() {
    if (this.actions.length > 0) {
      let action = this.actions.pop();
      action.undo();
      this.reloadChangesPanel();
    }
  }

  init() {
    let self = this;

    let initialContent = document.body.innerHTML;

    let tiwimEditAreaContainer = document.createElement('div');
    tiwimEditAreaContainer.id = 'tiwim-edit-content';
    tiwimEditAreaContainer.innerHTML = initialContent;
    document.body.innerHTML = tiwimEditAreaContainer.outerHTML;
    let tiwim_tool_content = `<div id="tiwim-tool-area">
    <div class="logo-container">
            <img id="logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAACWCAYAAAC4osHlAAAAh3pUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjaVY7RDcQwCEP/maIjECAGxqmqVroNbvwSJade34exLLCg8/u5aBs0FrLugQS4sLSUvUzwRJmbcBuzdLKmtnLyxKQyDTKc7Vm0lf/oisDl5o6OA4dUu5wqGqV1R6OVxxv5V7Ivp+888S6nG0rTLFpNLNE1AAAKBmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAtRXhpdjIiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjMzMCIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjE1MCIKICAgdGlmZjpJbWFnZVdpZHRoPSIzMzAiCiAgIHRpZmY6SW1hZ2VIZWlnaHQ9IjE1MCIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIvPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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" alt="TiWIM Logo" class="logo">
        </div>
           
        <div class="on-off-container">
          <label for="tiwim-on-off">Ativo?</label>
          <input type="checkbox" id="tiwim-on-off" name="tiwim-on-off" checked>          
        </div>

        <div class="actions-container">
            <div class="item" id="undo-action">
                <span>Desfazer</span>
            </div>
            <div class="item" id="save-action">
                <span>Salvar</span>
            </div>
        </div>
    
        <div class="changes-container">
            <div class="changes-header">Alterações realizadas</div>
            <div class="changes-content">
            </div>
        </div>   
    
    </div>`;
    let tiwimAreaContainer = document.createElement('div');
    tiwimAreaContainer.innerHTML = tiwim_tool_content;
    document.body.appendChild(tiwimAreaContainer.firstChild);

    let floatMenu = document.createElement('div');
    floatMenu.innerHTML = '<ul id="tiwimFloatMenu" class="contextMenu">\n' +
      '        <li class="tiwim-undo disabled"><a href="#undo">Desfazer</a></li>\n' +
      '        <li class="tiwim-edit separator"><a href="#edit">Alterar texto</a></li>\n' +
      '        <li class="tiwim-comment"><a href="#comment">Comentar</a></li>\n' +
      '        <li class="tiwim-add separator"><a href="#add-container">Adicionar ></a>\n' +
      '          <ul class="dropdown">\n' +
      '            <li class="tiwim-add-button"><a href="#add-button">Botão</a></li>\n' +
      '            <li class="tiwim-add-text"><a href="#add-link">Link</a></li>\n' +
      '            <li class="tiwim-add-list"><a href="#add-list">Lista</a></li>\n' +
      '            <li class="tiwim-add-link"><a href="#add-text">Texto</a></li>\n' +
      '          </ul>\n' +
      '        </li>\n' +
      '        <li class="tiwim-cut"><a href="#cut">Recortar</a></li>\n' +
      '        <li class="tiwim-copy"><a href="#copy">Copiar</a></li>\n' +
      '        <li class="tiwim-paste"><a href="#paste-container">Colar ></a>\n' +
      '          <ul class="dropdown">\n' +
      '            <li class="tiwim-paste"><a href="#paste-before">Colar antes</a></li>\n' +
      '            <li class="tiwim-paste"><a href="#paste">Colar depois</a></li>\n' +
      '            <li class="tiwim-paste"><a href="#paste-inside">Colar interno</a></li>\n' +
      '          </ul>\n' +
      '        </li>\n' +
      '        <li class="tiwim-duplicate"><a href="#duplicate">Duplicar</a></li>\n' +
      '        <li class="tiwim-delete separator"><a href="#delete">Remover</a></li>\n' +
      '    </ul>';
    document.body.appendChild(floatMenu.firstChild);

    this.createContextMenu();

    $j('#tiwim-tool-area #undo-action').click(function () {
      self.undoLast();
    });

    $j('#tiwim-tool-area #save-action').click(function () {
      // self.download();
      alert('Para salvar, apenas faça uma captura de tela (toda a tela). Você pode usar a tecla Prt Sc (Print screen) ou usar uma ferramenta de captura')
    });

    $j('#tiwim-tool-area #tiwim-on-off').change(function () {
      let isChecked = $j('#tiwim-on-off').is(':checked');

      if (isChecked) {
        self.active();
      } else {
        self.disable();
      }
    });

    this.reloadChangesPanel();
  }

  createContextMenu() {
    let self = this;
    $j(this.elementSelectors).not(self.excludeSelectors).mouseover(function () {
      if (self.isActive) {
        if (this.childElementCount === 0) {
          $j(this).addClass('hoverItem');
        }
      }
      return false;
    }).mouseout(function () {
      $j(this).removeClass('hoverItem');
    });
    $j(this.elementSelectors).not(self.excludeSelectors).contextMenu({
      menu: 'tiwimFloatMenu'
    },
      function (action, el, pos) {
        let finalEl = el[0];

        if (action === 'edit') {
          setTimeout(function () {
            let originalInnerText = finalEl.innerText;
            let newText = prompt('Informe o novo valor:', finalEl.innerText);

            if (!!newText) {
              finalEl.innerText = newText;
              self.registerAction(new EditTiwimAction(finalEl, originalInnerText, newText))
            }
          }, 100);
        } else if (action === 'undo') {
          self.undoLast();
        } else if (action === 'cut') {
          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          self.currentElement = finalEl.cloneNode(true);
          self.currentElementData = TiwimElement.serialize(finalEl);
          parent.removeChild(finalEl);

          let finalParentHtml = parent.innerHTML;

          self.registerAction(new CutTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'copy') {
          self.currentElement = finalEl.cloneNode(true);
          self.currentElementData = TiwimElement.serialize(finalEl);
        } else if (action === 'paste' || action === 'paste-inside' || action === 'paste-before') {
          self.currentElement = self.currentElement.cloneNode(true);

          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          if (action === 'paste-inside') {
            finalEl.appendChild(self.currentElement);
          } else {
            let refChild = finalEl.nextSibling ? finalEl.nextSibling : finalEl;
            if (action === 'paste-before') {
              refChild = finalEl;
            }
            parent.insertBefore(self.currentElement, refChild);
          }

          let finalParentHtml = parent.innerHTML;

          self.registerAction(new PasteTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'delete') {
          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;
          parent.removeChild(finalEl);
          let finalParentHtml = parent.innerHTML;

          self.registerAction(new DeleteTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'comment') {
          let originalClassList = finalEl.classList;
          setTimeout(function () {
            let comment = prompt('Informe o comentário:');

            if (!!comment) {
              finalEl.classList.add('hasComment');
              let finalClassList = finalEl.classList;
              self.registerAction(new CommentTiwimAction(finalEl, originalClassList, finalClassList, comment))
            }
          }, 100);

        } else if (action === 'add-text') {
          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          let newElement = document.createElement('p');
          newElement.innerText = 'Novo texto';

          let refChild = finalEl.nextSibling ? finalEl.nextSibling : finalEl;
          parent.insertBefore(newElement, refChild);

          let finalParentHtml = parent.innerHTML;
          self.registerAction(new CreateElementTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'add-button') {
          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          let newElement = document.createElement('button');
          newElement.innerText = 'Novo botão';

          let refChild = finalEl.nextSibling ? finalEl.nextSibling : finalEl;
          parent.insertBefore(newElement, refChild);

          let finalParentHtml = parent.innerHTML;
          self.registerAction(new CreateElementTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'add-link') {
          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          let newElement = document.createElement('a');
          newElement.href = '#';
          newElement.innerText = 'Novo link';

          let refChild = finalEl.nextSibling ? finalEl.nextSibling : finalEl;
          parent.insertBefore(newElement, refChild);

          let finalParentHtml = parent.innerHTML;
          self.registerAction(new CreateElementTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'add-list') {
          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          let newElement = document.createElement('ul');
          let newItem = document.createElement('li');
          newItem.innerText = 'Novo item';
          newElement.appendChild(newItem);

          let refChild = finalEl.nextSibling ? finalEl.nextSibling : finalEl;
          parent.insertBefore(newElement, refChild);

          let finalParentHtml = parent.innerHTML;
          self.registerAction(new CreateElementTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        } else if (action === 'duplicate') {
          let newElement = finalEl.cloneNode(true);

          let parent = finalEl.parentNode;
          let originalParentHtml = parent.innerHTML;

          let refChild = finalEl.nextSibling ? finalEl.nextSibling : finalEl;
          parent.insertBefore(newElement, refChild);
          let finalParentHtml = parent.innerHTML;

          self.registerAction(new PasteTiwimAction(finalEl, originalParentHtml, finalParentHtml, parent))
        }
        self.reload(); // TODO: verificar necessidade de recarregar o menu
      }, function (el) {
        let finalEl = el[0];
        let tiwimMenu = $j('#tiwimFloatMenu');

        if (!!finalEl.innerText) {
          tiwimMenu.enableContextMenuItems('#edit');
        } else {
          tiwimMenu.disableContextMenuItems('#edit');
        }

        if (self.currentElement !== null) {
          tiwimMenu.enableContextMenuItems('#paste-container');
        } else {
          tiwimMenu.disableContextMenuItems('#paste-container');
        }

        if (self.actions.length > 0) {
          tiwimMenu.enableContextMenuItems('#undo');
        } else {
          tiwimMenu.disableContextMenuItems('#undo');
        }
      });
  }

  reload() {
    this.createContextMenu();
  }

  active() {
    this.isActive = true;
    $j(this.elementSelectors).not(self.excludeSelectors).enableContextMenu();
  }

  disable() {
    this.isActive = false;
    $j(this.elementSelectors).disableContextMenu();
  }

  download() {
    let actualTimestamp = new Date().getTime();
    let finalFileName = 'tiwim_' + window.location.hostname + '_' + actualTimestamp + '.txt';
    let obj = {
      actions: this.actions
    };
    this.saveTextAsFile(JSON.stringify(obj), finalFileName)
  }

  saveTextAsFile(textToWrite, fileNameToSaveAs) {
    var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    } else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
      downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
    }

    downloadLink.click();
  }

  loadChanges() {
    // TODO: carregar as alterações novamente
  }

}
