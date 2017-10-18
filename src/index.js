/* global $ */
import PDFJS from 'pdfjs-dist';
import nextTick from 'next-tick';
import { generateId } from './utils';


PDFJS.disableWorker = true;
const defaultOptions = {};

class lePdf {
  constructor(el, options) {
    this._el = el;
    this.userOptions = options;
    this.options = this.getOptions();
    this.render();
  }

  _getPageContext(page) {
    const width = this.options.width || $(this._el).width();
    const viewport = page.getViewport(1);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = width / viewport.width;

    canvas.width = width;
    canvas.height = scale * viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: page.getViewport(scale),
    };

    return { canvas, renderContext };
  }

  /**
   * Merge defaultOptions and user's options;
   *
   * @access public
   */
  getOptions() {
    const options = $.extend(true, {}, defaultOptions, this.userOptions);
    options.id = options.id || generateId();

    return options;
  }

  async renderPages() {
    const pdfDoc = await PDFJS.getDocument(this.options.url);
    const promises = [];
    const result = [];

    for (let num = 1; num <= pdfDoc.numPages; num += 1) {
      promises.push(pdfDoc.getPage(num));
    }

    const pdfPages = await Promise.all(promises);

    pdfPages.forEach((item) => {
      const { canvas, renderContext } = this._getPageContext(item);
      result.push(canvas);
      item.render(renderContext);
    });
    return result;
  }

  async renderElement() {
    const { id } = this.options;
    const result = $(this._el).clone().addClass(id);
    const carouselEl = $('<div />').addClass('carousel-container');
    const pages = await this.renderPages();
    const slides = pages.map(item => $('<div />').addClass('swiper-slide').append(item));

    const html = `
    <div class="swiper-container">
      <div class="swiper-wrapper">
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-button-next"></div>
      <div class="swiper-button-prev"></div>
    </div>
    `;
    carouselEl.html(html);
    result.append(carouselEl);
    result.find('.swiper-wrapper').append(slides);
    return result;
  }

  async render() {
    this.element = await this.renderElement();
    $(this._el).replaceWith(this.element);

    nextTick(() => {
      this.swiper = new window.Swiper('.swiper-container', {
        pagination: {
          el: '.swiper-pagination',
          type: 'progressbar',
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    });
  }
}


window.lePdf = lePdf;
