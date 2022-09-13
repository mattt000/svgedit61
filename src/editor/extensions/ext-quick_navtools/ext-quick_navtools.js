/**
 * @file ext-quick_navtools.js
 *
 * @license MIT
 *
 * @copyright 2010 Alexis Deveria
 *
 */

/**
 * This is a extened quick access button SVG-Edit extention. It adds "Zoom to fit, 
 * 1.5mm Pen size, 2.0mm Pen size" buttons in the bottom pannel.
 * 
*/

const name = 'quick_navtools'

// HTML template load
import buttonsNodes from './buttons.html';

export default {
  name,
  async init () {
    const svgEditor = this
    const { svgCanvas } = svgEditor
    const { $id, $click } = svgCanvas

      /**
    * @type {module}
    */
    const changeZoom = () => {
      svgEditor.zoomChanged(window, 'canvas')
    }

    return {
      callback () {
        // Add the button and its handler(s)
        const buttonsTemplate = document.createElement('template')
        buttonsTemplate.innerHTML = buttonsNodes;

        $id('tools_bottom').append(buttonsTemplate.content.cloneNode(true))

        $click($id('navToolZoomToFit'), changeZoom)

        $click($id('navTool15Pen'), () => {
          localStorage.setItem('fhpathWidth', '1.5mm');
          $id('stroke_width').value = '1.5mm';
        })

        $click($id('navTool2Pen'), () => {
          localStorage.setItem('fhpathWidth', '2mm');
          $id('stroke_width').value = '2mm';
        })
        
        $click($id('navTool100Opacity'), () => {
          // Raihan please set the opacity of the object to 100% (1.0)
          $id('opacity').value = '1';
        })
        
        $click($id('navTool50Opacity'), () => {
          // Raihan please set the opacity of the object to 50% (0.5)
          $id('opacity').value = '0.5';

        })
      },
    }
  }
}
