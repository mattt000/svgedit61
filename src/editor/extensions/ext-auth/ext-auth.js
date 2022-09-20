/**
 * @file ext-auth.js
 *
 * @license MIT
 *
 * @copyright 2010 Alexis Deveria
 *
 */

/**
 * This ext. enable the athurization feature in app
 * 
*/

const name = 'auth'
import http from '../../../common/http';
import htmlTemplate from './template.html';
import { checkLogin } from './utill';

// Add login form
const loginForm = document.createElement('div')
loginForm.innerHTML = htmlTemplate;

export default {
  name,
  async init () {
    const svgEditor = this
    const { svgCanvas } = svgEditor
    const { $id, $click } = svgCanvas

    const login = async (username, password) => {
        const credential = {username, password}

        try {
          const res = await http.post('/api/auth/login', credential);

          localStorage.setItem('user', JSON.stringify(res))
          $id('loginMessage').innerText = "";
          loginForm.remove()
          
        } catch (err) {
          $id('loginMessage').innerText = err.message;
        }
    }

    return {
      callback () {
        const template = document.createElement('template')
        template.innerHTML = `<se-menu-item id="logout_button" label="Logout" src="logo.svg"></se-menu-item>`
        $id('main_button').append(template.content.cloneNode(true))

        $click($id('logout_button'), (e) => {
          localStorage.removeItem('user');
        })

        $click($id('container'), (event) => {
            const {isloggedIn} = checkLogin();
          
            if (!isloggedIn) {
                document.querySelector('body').append(loginForm)
                
                $id('loginForm').onsubmit = (e) => {
                  e.preventDefault();
                  const username = e.currentTarget[0].value;
                  const password = e.currentTarget[1].value
                  login(username, password)
                }
            }

        }) 
      },
    }
  }
}
