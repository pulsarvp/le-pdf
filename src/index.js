/* global $ */
/* global PDFJS */
import nextTick from 'next-tick';
import { generateId } from './utils';
import './index.css';


PDFJS.disableWorker = true;
const defaultOptions = {};

const horizontalOptions = {
  pagination: {
    el: '.swiper-pagination',
    type: 'progressbar',
  },
};

const verticalOptions = {
  direction: 'vertical',
  freeMode: true,
  scrollbar: {
    el: '.swiper-scrollbar',
  },
  mousewheel: true,
};

const Carousel = (player, options) => {
  const { direction, pages } = options;
  const verticalTemplate = `
    <div class="swiper-container">
      <div class="swiper-wrapper">
      </div>
      <div class="swiper-scrollbar"></div>
    </div>
  `;

  const horizontalTempalte = `
    <div class="swiper-container">
      <div class="swiper-wrapper">
      </div>
      <div class="swiper-pagination"></div>
    </div>
  `;
  const html = direction === 'vertical' ? verticalTemplate : horizontalTempalte;
  const result = $('<div/>', {
    class: 'le-pdf-carousel',
    html,
  });

  const slides = pages.map(item => $('<div />').addClass('swiper-slide').append(item));
  result.find('.swiper-wrapper').append(slides);
  return result;
};

const Controls = (player) => {
  const result = $('<div/>', {
    class: 'le-pdf-controls',
  });

  const next = $('<button/>', {
    class: 'le-pdf-control le-pdf-control--next',
    html: `
      <div class="swiper-button-next"></div>
    `,
    on: {
      click: () => player.swiper.slideNext(),
    },
  });
  const prev = $('<button/>', {
    class: 'le-pdf-control le-pdf-control--prev',
    html: `
      <div class="swiper-button-prev"></div>
    `,
    on: {
      click: () => player.swiper.slidePrev(),
    },
  });

  const childrens = [next, prev];

  childrens.forEach(item => result.prepend(item));

  return result;
};

class lePdf {
  constructor(el, options) {
    this._el = $(el);
    this._initialEl = $(el).clone();
    this._inited = false;
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
    $(canvas).css('height', `${scale * viewport.height}px`);

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
    const { id, direction } = this.options;
    const result = $(this._el).clone()
      .addClass(id)
      .addClass('le-pdf');

    if (direction) {
      result.addClass(`le-pdf--${direction}`);
    }

    const pages = await this.renderPages();

    const childrens = [
      Carousel(this, {
        pages,
        direction,
      }),
      Controls(this),
    ];

    childrens.forEach(item => result.prepend(item));

    return result;
  }

  async render() {
    const { direction } = this.options;
    if (this._inited) {
      this.destroy();
    }

    const swiperOptions = direction === 'vertical' ? verticalOptions : horizontalOptions;

    this.element = await this.renderElement();
    $(this._el).replaceWith(this.element);

    nextTick(() => {
      this.swiper = new window.Swiper('.swiper-container', {
        keyboard: {
          enabled: true,
        },
        ...swiperOptions,
      });
      // this.swiper.on('init', this._onSwiperInit.bind(this));
    });
  }

  destroy() {
    $(this._el).replaceWith(this._initialEl);
    // this.swiper.off('init');
  }
}


window.lePdf = lePdf;
