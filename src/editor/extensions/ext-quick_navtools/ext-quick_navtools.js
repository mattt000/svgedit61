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
    const changeZoom = (value) => {
      if (value === 'canvas') {
        svgEditor.zoomChanged(window, value)
        return
      }

      const zoomlevel = Number(value) > 0.1 ? Number(value) * 0.01 : 0.1
      const zoom = svgCanvas.getZoom()
      const { workarea } = svgEditor
      svgEditor.zoomChanged(window, {
        width: 0,
        height: 0,
        // center pt of scroll position
        x: (workarea.scrollLeft + parseFloat(getComputedStyle(workarea, null).width.replace('px', '')) / 2) / zoom,
        y: (workarea.scrollTop + parseFloat(getComputedStyle(workarea, null).height.replace('px', '')) / 2) / zoom,
        zoom: zoomlevel
      }, true)
      
    }
    
    const fhpathWidth = localStorage.getItem('fhpathWidth');

    return {
      callback () { 
        // Add the button and its handler(s)
        const buttonsTemplate = document.createElement('template')
        buttonsTemplate.innerHTML = buttonsNodes;

        $id('tools_bottom').append(buttonsTemplate.content.cloneNode(true))

        // <!-- Raihan, please add the code to implement the zoom 100%(1.0) & 50%(0.5) -->
        $click($id('navToolZoomTo100'), () => changeZoom("100"))
        $click($id('navToolZoomTo50'), () => changeZoom("50"))

        $click($id('navToolZoomToFit'), () => changeZoom('canvas'))

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
          const layers = $id('svgcanvas').querySelectorAll('.layer')
          layers[0].setAttribute('opacity', 1)

          localStorage.setItem('lineOpacity', 1);
          e.target.classList.add('active-btn')
          $id("navTool50Opacity").classList.remove('active-btn')
        })
        
        $click($id('navTool50Opacity'), (e) => {
          const layers = $id('svgcanvas').querySelectorAll('.layer')
          layers[0].setAttribute('opacity', 0.5)

          localStorage.setItem('lineOpacity', 0.5);
          e.target.classList.add('active-btn')
          $id("navTool100Opacity").classList.remove('active-btn')
        })

        $id("navTool100Opacity").classList.add('active-btn')

        if (fhpathWidth && fhpathWidth === '2mm') {
          $id("navTool2Pen").classList.add('active-btn')
        } else {
          $id("navTool15Pen").classList.add('active-btn')
        }
      },
    }
  }
}
