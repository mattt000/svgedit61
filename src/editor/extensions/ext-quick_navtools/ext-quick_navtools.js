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
    
    const opacity = localStorage.getItem('lineOpacity');
    const fhpathWidth = localStorage.getItem('fhpathWidth');

    return {
      callback () { 
        // Add the button and its handler(s)
        const buttonsTemplate = document.createElement('template')
        buttonsTemplate.innerHTML = buttonsNodes;

        $id('tools_bottom').append(buttonsTemplate.content.cloneNode(true))

        <!-- Raihan, please add the code to implement the zoom 100%(1.0) & 50%(0.5) -->
        $click($id('navToolZoomTo100'), changeZoom)
        $click($id('navToolZoomTo50'), changeZoom)

        $click($id('navToolZoomToFit'), changeZoom)

        $click($id('navTool15Pen'), (e) => {
          localStorage.setItem('fhpathWidth', '1.5mm');
          $id('stroke_width').value = '1.5mm';
          e.target.classList.add('active-btn')
          $id("navTool2Pen").classList.remove('active-btn')
        })

        $click($id('navTool2Pen'), (e) => {
          localStorage.setItem('fhpathWidth', '2mm');
          $id('stroke_width').value = '2mm';
          e.target.classList.add('active-btn')
          $id("navTool15Pen").classList.remove('active-btn')
        })
        
        $click($id('navTool100Opacity'), (e) => {
          svgCanvas.changeSelectedAttribute('opacity', 1)
          localStorage.setItem('lineOpacity', 1);
          e.target.classList.add('active-btn')
          $id("navTool50Opacity").classList.remove('active-btn')
        })
        
        $click($id('navTool50Opacity'), (e) => {
          svgCanvas.changeSelectedAttribute('opacity', 0.5)
          localStorage.setItem('lineOpacity', 0.5);
          e.target.classList.add('active-btn')
          $id("navTool100Opacity").classList.remove('active-btn')
        })

        if (opacity && opacity === 1) {
          $id("navTool100Opacity").classList.add('active-btn')
        } else {
          $id("navTool50Opacity").classList.add('active-btn')
        }

        if (fhpathWidth && fhpathWidth === '2mm') {
          $id("navTool2Pen").classList.add('active-btn')
        } else {
          $id("navTool15Pen").classList.add('active-btn')
        }
      },
    }
  }
}
