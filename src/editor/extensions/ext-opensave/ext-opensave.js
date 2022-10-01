/* globals seConfirm */
/**
 * @file ext-opensave.js
 *
 * @license MIT
 *
 * @copyright 2020 OptimistikSAS
 *
 */

/**
   * @type {module:svgcanvas.EventHandler}
   * @param {external:Window} wind
   * @param {module:svgcanvas.SvgCanvas#event:saved} svg The SVG source
   * @listens module:svgcanvas.SvgCanvas#event:saved
   * @returns {void}
   */
import { fileOpen } from 'browser-fs-access';
import buttonsNodes from './bottomButtons.html';
import opendialog from './opendialog.html';

import http from '../../../common/http';
import { checkLogin } from '../ext-auth/utill';


const openDialopTemplate = document.createElement('div')
openDialopTemplate.innerHTML = opendialog

const name = 'opensave'
let handle = null

const loadExtensionTranslation = async function (svgEditor) {
  let translationModule
  const lang = svgEditor.configObj.pref('lang')
  try {
    translationModule = await import(`./locale/${lang}.js`)
  } catch (_error) {
    console.warn(`Missing translation (${lang}) for ${name} - using 'en'`)
    translationModule = await import('./locale/en.js')
  }
  svgEditor.i18next.addResourceBundle(lang, 'translation', translationModule.default, true, true)
}

export default {
  name,
  async init (_S) {
    const svgEditor = this
    const { svgCanvas } = svgEditor
    const { $id, $click } = svgCanvas
    await loadExtensionTranslation(svgEditor)
    /**
    * @param {Event} e
    * @returns {void}
    */
    const importImage = (e) => {
      $id('se-prompt-dialog').title = this.i18next.t('notification.loadingImage')
      $id('se-prompt-dialog').setAttribute('close', false)
      e.stopPropagation()
      e.preventDefault()
      const file = (e.type === 'drop') ? e.dataTransfer.files[0] : e.currentTarget.files[0]
      if (!file) {
        $id('se-prompt-dialog').setAttribute('close', true)
        return
      }

      if (!file.type.includes('image')) {
        return
      }
      // Detected an image
      // svg handling
      let reader
      if (file.type.includes('svg')) {
        reader = new FileReader()
        reader.onloadend = (ev) => {
          const newElement = this.svgCanvas.importSvgString(ev.target.result, true)
          this.svgCanvas.alignSelectedElements('m', 'page')
          this.svgCanvas.alignSelectedElements('c', 'page')
          // highlight imported element, otherwise we get strange empty selectbox
          this.svgCanvas.selectOnly([newElement])
          $id('se-prompt-dialog').setAttribute('close', true)
        }
        reader.readAsText(file)
      } else {
        // bitmap handling
        reader = new FileReader()
        reader.onloadend = ({ target: { result } }) => {
          /**
              * Insert the new image until we know its dimensions.
              * @param {Float} imageWidth
              * @param {Float} imageHeight
              * @returns {void}
              */
          const insertNewImage = (imageWidth, imageHeight) => {
            const newImage = this.svgCanvas.addSVGElementsFromJson({
              element: 'image',
              attr: {
                x: 0,
                y: 0,
                width: imageWidth,
                height: imageHeight,
                id: this.svgCanvas.getNextId(),
                style: 'pointer-events:inherit'
              }
            })
            this.svgCanvas.setHref(newImage, result)
            this.svgCanvas.selectOnly([newImage])
            this.svgCanvas.alignSelectedElements('m', 'page')
            this.svgCanvas.alignSelectedElements('c', 'page')
            this.topPanel.updateContextPanel()
            $id('se-prompt-dialog').setAttribute('close', true)
          }
          // create dummy img so we know the default dimensions
          let imgWidth = 100
          let imgHeight = 100
          const img = new Image()
          img.style.opacity = 0
          img.addEventListener('load', () => {
            imgWidth = img.offsetWidth || img.naturalWidth || img.width
            imgHeight = img.offsetHeight || img.naturalHeight || img.height
            insertNewImage(imgWidth, imgHeight)
          })
          img.src = result
        }
        reader.readAsDataURL(file)
      }
    }
    // create an input with type file to open the filesystem dialog
    const imgImport = document.createElement('input')
    imgImport.type = 'file'
    imgImport.addEventListener('change', importImage)
    // dropping a svg file will import it in the svg as well
    this.workarea.addEventListener('drop', importImage)

    const clickClear = async function () {
      const [x, y] = svgEditor.configObj.curConfig.dimensions
      const ok = await seConfirm(svgEditor.i18next.t('notification.QwantToClear'))
      if (ok === 'Cancel') {
        return
      }
      svgEditor.leftPanel.clickSelect()
      svgEditor.svgCanvas.clear()
      svgEditor.svgCanvas.setResolution(x, y)
      svgEditor.updateCanvas(true)
      svgEditor.zoomImage()
      svgEditor.layersPanel.populateLayers()
      svgEditor.topPanel.updateContextPanel()
      svgEditor.topPanel.updateTitle('untitled.svg')
    }

    /**
     * By default,  this.editor.svgCanvas.open() is a no-op. It is up to an extension
     *  mechanism (opera widget, etc.) to call `setCustomHandlers()` which
     *  will make it do something.
     * @returns {void}
     */
    const clickOpen = async function () { 
      // hide dialog form window
      const openFileUploadDialog = document.querySelector("#openFileUploadDialog")
      if (openFileUploadDialog) openDialopTemplate.remove();

      // ask user before clearing an unsaved SVG
      const response = await svgEditor.openPrep()
      if (response === 'Cancel') { return }
      svgCanvas.clear()
      try {
        const blob = await fileOpen({
          mimeTypes: ['image/*']
        })
        const svgContent = await blob.text()
        await svgEditor.loadSvgString(svgContent)
        svgEditor.updateCanvas()
        handle = blob.handle
        svgEditor.topPanel.updateTitle(blob.name)
        svgEditor.svgCanvas.runExtensions('onOpenedDocument', {
          name: blob.name,
          lastModified: blob.lastModified,
          size: blob.size,
          type: blob.type
        })

        setTimeout(() => {
          svgEditor.zoomChanged(window, 'canvas')
        }, 1000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          return console.error(err)
        }
      }
    }

    // open dialog to upload svg image
    const clickOpenDialog = () => {
      const imageContainer = openDialopTemplate.querySelector('#imageContainer')
      const uploadFromPcButton = openDialopTemplate.querySelector('#uploadFromPcButton');
      const closeButton = openDialopTemplate.querySelector('#closeOpenPopUp');

      document.querySelector('body').appendChild(openDialopTemplate);
      
      const {isloggedIn} = checkLogin();

      const isRemove = removeChilds(imageContainer);        
      if (isRemove && isloggedIn) {
        pushImagesToDomDialog(imageContainer)
      }

      const messageNode = document.createElement('p');
      messageNode.classList.add('message')
      messageNode.innerText = "Loading..."
      imageContainer.appendChild(messageNode)

      uploadFromPcButton.addEventListener('click', clickOpen) 
      closeButton.addEventListener('click', ()=> {
        openDialopTemplate.remove()
      })

      const handleImageContainerClick = async (e) => {
        if (e.target.classList.contains('imageContainerChildImage')) {
          let currentSrc = e.target.currentSrc;
          const fileName = e.target.getAttribute('data-name');

          svgEditor.loadFromURL(currentSrc);
          svgEditor.topPanel.updateTitle(fileName+'-01.svg')

          setTimeout(() => {
            svgEditor.zoomChanged(window, 'canvas')
          }, 1000);
          openDialopTemplate.remove();       
          
        }

        if (e.target.classList.contains('opensaveDeleteBtn')) {
          const id = e.target.getAttribute('data-id')

          try {
            await http.delete(`/api/templates/${id}`)
          } catch (err) {
            console.log(err);
          }

          e.target.parentNode.remove();
        }

        if (e.target.classList.contains('opensaveStatusBtn')) {
          const id = e.target.getAttribute('data-id')
          let value = true;

          if (e.target.classList.contains('active')) {
            e.target.classList.remove('active');
            value = false;
          }

         const {isloggedIn} = checkLogin();
      
          if (isloggedIn) {
            try {
              const res = await http.put(`/api/templates/${id}`, {status: value})
              if (res.data.status) {
                e.target.classList.add('active');
              }              
            } catch (err) {
              console.log(err);
            }
          }
        }
      }

      // load svg from suggestion
      imageContainer.addEventListener('click', handleImageContainerClick);     
    }

    /**
     * Show images in dialog
     * @param {Node} imageContainer
     * @returns {void}
     */

    const pushImagesToDomDialog = async (imageContainer) => {
      try {
        const images = await http.get('/api/templates');
        
        const messageNode = imageContainer.querySelector('.message')
        
        if (images && images.length > 0) {
          messageNode.remove();
  
          images.forEach((image)=> {
            const imageEl = document.createElement('img')
            const deleteIconEl = document.createElement('img')
            const statusIconEl = document.createElement('img')
            const imageNameEl = document.createElement('p')
            const imageItemEl = document.createElement('div')
            const deleteButtonEl = document.createElement('button')
            const statusButtonEl = document.createElement('button')
  
            imageEl.src =image.url;
            imageEl.setAttribute('data-name', image.name)
            imageNameEl.innerText = image.name;
  
            imageEl.classList.add('imageContainerChildImage')
            imageItemEl.classList.add('imageContainerChild')
            deleteButtonEl.classList.add('opensaveDeleteBtn')
            statusButtonEl.classList.add('opensaveStatusBtn')
            
            imageItemEl.appendChild(imageEl)
            imageItemEl.appendChild(imageNameEl)
            imageContainer.appendChild(imageItemEl)
  
            const {user, isloggedIn} = checkLogin();
  
            if (isloggedIn && user.isAdmin) {
              deleteIconEl.src = './images/trash_icon.svg';
              deleteButtonEl.append(deleteIconEl)
              deleteButtonEl.setAttribute('data-id', image._id)
  
              statusIconEl.src = './images/check-round-icon.svg';
              statusButtonEl.append(statusIconEl)
              statusButtonEl.setAttribute('data-id', image._id)
  
              if (image.status) {
                statusButtonEl.classList.add('active')
              }
              
              imageItemEl.append(deleteButtonEl)
              imageItemEl.append(statusButtonEl)
            }
          })
  
        } else {        
          messageNode.innerHTML = "Not found!"
        }
      } catch (err) {
        console.log(err);
      }
      
    }

    /**
     * Remove childs nodes
     * @param {Node} parentNode
     * @returns {true}
     */
    const removeChilds = (parentNode) => {
      if (parentNode) {
        let child = parentNode.lastElementChild; 
        while (child) {
          parentNode.removeChild(child);
          child = parentNode.lastElementChild;
        }
      }

      return true;
    }

    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
      const byteCharacters = atob(b64Data)
      const byteArrays = []
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      const blob = new Blob(byteArrays, { type: contentType })
      return blob
    }

    /**
     *
     * @returns {void}
     */
    const clickSave = async function (type) {
      const $editorDialog = $id('se-svg-editor-dialog')
      const editingsource = $editorDialog.getAttribute('dialog') === 'open'
      if (editingsource) {
        svgEditor.saveSourceEditor()
      } else {
        // In the future, more options can be provided here
        const saveOpts = {
          images: svgEditor.configObj.pref('img_save'),
          round_digits: 2
        }
        // remove the selected outline before serializing
        svgCanvas.clearSelection()
        // Update save options if provided
        if (saveOpts) {
          const saveOptions = svgCanvas.mergeDeep(svgCanvas.getSvgOption(), saveOpts)
          for (const [key, value] of Object.entries(saveOptions)) {
            svgCanvas.setSvgOption(key, value)
          }
        }
        svgCanvas.setSvgOption('apply', true)

        // no need for doctype, see https://jwatt.org/svg/authoring/#doctype-declaration
        const svg = '<?xml version="1.0"?>\n' + svgCanvas.svgCanvasToString()
        const b64Data = svgCanvas.encode64(svg)
        const blob = b64toBlob(b64Data, 'image/svg+xml')
        try {
          let num;
          let numNext;
          let fileTitle = svgEditor.title;
          let fileTitleNext = svgEditor.title;

          const fileTitleArray = svgEditor.title.split('-');
          num = parseInt(fileTitleArray[fileTitleArray.length - 1]);
          
          if (num) {
            numNext = parseInt(fileTitleArray[fileTitleArray.length - 1])+1;
  
            if (num < 10) {
              num = "0" + num;
            }
  
            if (num < 10) {
              numNext = "0" + numNext;
            }
  
            fileTitleArray[fileTitleArray.length - 1] = num;
            fileTitle = fileTitleArray.join('-');

            fileTitleArray[fileTitleArray.length - 1] = numNext;
            fileTitleNext = fileTitleArray.join('-')+'.svg';
          }

          // @todo: file save in local mechine

          // if (type === 'save' && handle !== null) {
          //   const throwIfExistingHandleNotGood = false
          //   handle = await fileSave(blob,
          //   {
          //     fileName: fileTitle,
          //     extensions: ['.svg']
          //   },handle, throwIfExistingHandleNotGood)

          // } else {
          //   handle = await fileSave(blob, {
          //     fileName: fileTitle,
          //     extensions: ['.svg']
          //   })
          // }
          svgEditor.topPanel.updateTitle(`${fileTitleNext}`)
          // svgCanvas.runExtensions('onSavedDocument', {
          //   name: handle.name,
          //   kind: handle.kind
          // })

          const buttonContent = $id('opensaveBottomSaveText').innerHTML;

          $id('opensaveBottomSaveText').innerText = 'Saving...';
          $id('opensaveBottomSave').classList.add('active');

          const formData = new FormData();
          formData.append('image', blob, `${fileTitle}.svg`)

          try {
            await http.post('/api/templates', formData)
            $id('opensaveBottomSaveText').innerHTML = buttonContent;
            $id('opensaveBottomSave').classList.remove('active');
          } catch (err) {
            console.log(err);
          }
          
        } catch (err) {
          if (err.name !== 'AbortError') {
            return console.error(err)
          }
        }
      }
    }

    return {
      name: svgEditor.i18next.t(`${name}:name`),
      // The callback should be used to load the DOM with the appropriate UI items
      callback () {
        const buttonTemplate = `
        <se-menu-item id="tool_clear" label="opensave.new_doc" shortcut="N" src="new.svg"></se-menu-item>`
        svgCanvas.insertChildAtIndex($id('main_button'), buttonTemplate, 0)
        const openButtonTemplate = '<se-menu-item id="tool_open" label="opensave.open_image_doc" src="open.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), openButtonTemplate, 1)
        const saveButtonTemplate = '<se-menu-item id="tool_save" label="opensave.save_doc" shortcut="S" src="saveImg.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), saveButtonTemplate, 2)
        const saveAsButtonTemplate = '<se-menu-item id="tool_save_as" label="opensave.save_as_doc" src="saveImg.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), saveAsButtonTemplate, 3)
        const importButtonTemplate = '<se-menu-item id="tool_import" label="tools.import_doc" src="importImg.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), importButtonTemplate, 4)

        // Add the button and its handler(s)
        const buttonsTemplate = document.createElement('template')
        buttonsTemplate.innerHTML = buttonsNodes;

        $id('tools_bottom').append(buttonsTemplate.content.cloneNode(true))

        // handler
        $click($id('tool_clear'), clickClear.bind(this))
        $click($id('tool_open'), clickOpenDialog.bind(this))
        $click($id('tool_save'), clickSave.bind(this, 'save'))
        $click($id('tool_save_as'), clickSave.bind(this, 'saveas'))
        $click($id('tool_import'), () => imgImport.click())

        $click($id('opensaveBottomOpen'), clickOpenDialog.bind(this))
        $click($id('opensaveBottomSave'), clickSave.bind(this, 'save'))
        $click($id('opensaveBottomSaveAs'), clickSave.bind(this, 'saveas'))
      }
    }
  }
}
