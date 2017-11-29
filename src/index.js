/* global $ */
/* global PDFJS */
import nextTick from 'next-tick';
import { generateId, isFunction } from './utils';
import './index.css';

PDFJS.disableWorker = true;
const defaultOptions = {
  direction: 'horizontal',
};

const horizontalOptions = {
  pagination: {
    el: '.swiper-pagination',
    type: 'progressbar',
  },
  autoHeight: true,
};

const verticalOptions = {
  direction: 'vertical',
  freeMode: true,
  scrollbar: {
    el: '.swiper-scrollbar',
    draggable: true,
  },
  mousewheel: true,
};

const SwiperSlide = children =>
  $('<div />', {
    class: 'swiper-slide',
  }).append(children);

const Carousel = (player, options) => {
  const { direction, pages = [] } = options;
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
    css: { height: `${player._slideHeight}px` },
  });

  const slides = pages.map(item =>
    $('<div />')
      .addClass('swiper-slide')
      .append(item));
  if (slides.length > 0) {
    result.find('.swiper-wrapper').append(slides);
  }
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

const Loader = () =>
  $('<div/>', {
    text: 'Загрузка...',
    class: 'le-pdf-loader',
  });

const ErrorManager = () =>
  $('<div/>', {
    class: 'le-pdf-error',
  });

/**
 * @class lePdf
 * @param {jQuery|HTMLElement} element Element when lePdf will init
 * @param {Object} [options]
 * @param {String} [options.direction='horizontal'] Could be 'horizontal' or 'vertical'.
 * @param {String} [options.url] Url to pdf document
 * @param {Number|String} [options.width] Width of slider
 * @param {Function} [options.onInit] On init callback
 */
class lePdf {
  constructor(el, options) {
    this.element = $(el);
    this._initialEl = $(el).clone();
    this._inited = false;
    this._error = '';
    this.userOptions = options;
    this.options = this.getOptions();
    this.render().then(() => this.onInit());
  }

  onInit() {
    const { onInit } = this.options;
    this._updateErorrs();
    if (onInit != null && isFunction(onInit)) {
      onInit.apply(this);
    }
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

  async getPages() {
    const { direction } = this.options;
    if (this.pdfDoc == null) {
      this._pdfDoc = await PDFJS.getDocument(this.options.url);
    }

    // Get slide height for vertical mode
    if (direction === 'vertical') {
      const viewport = (await this._pdfDoc.getPage(1)).getViewport(1);
      const scale = this.width / viewport.width;
      const slideHeight = scale * viewport.height;
      this._slideHeight = slideHeight + 10;
    }
    const promises = [];

    for (let num = 1; num <= this._pdfDoc.numPages; num += 1) {
      promises.push(this._pdfDoc.getPage(num));
    }

    if (this._pages == null) {
      this._pages = await Promise.all(promises);
    }
    return this._pages;
  }

  rerender() {
    $(this.element).replaceWith(this.element);
  }

  get width() {
    return this.options.width || $(this.element).width();
  }

  renderPage(page) {
    const width = this.options.width || $(this.element).width();
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
    page.render(renderContext);

    return canvas;
  }

  async render() {
    const { id, direction } = this.options;
    let pages = [];

    if (this._inited) {
      this.destroy();
    }

    this.element.addClass(id).addClass('le-pdf');

    if (direction) {
      this.element.addClass(`le-pdf--${direction}`);
    }

    this.element.prepend(Loader());

    try {
      pages = await this.getPages();
    } catch (err) {
      let { message } = err;
      if (err.name === 'MissingPDFException') {
        message = `PDF файл '${this.options.url}' не найден.`;
      } else if (err.name === 'InvalidPDFException') {
        message = `PDF файл '${this.options.url}' поврежден.`;
      }
      this.error = message;
    }

    this.element.addClass('le-pdf--pdf-loaded');

    const childrens = [
      Carousel(this, {
        direction,
      }),
      ErrorManager(),
      Controls(this),
    ];

    childrens.forEach(item => this.element.prepend(item));

    const swiperOptions =
      direction === 'vertical' ? verticalOptions : horizontalOptions;

    if (pages.length === 0) return;

    nextTick(() => {
      const swiperHTMLelement = this.element.find('.swiper-container');
      this.swiper = new window.Swiper(swiperHTMLelement, {
        keyboard: {
          enabled: true,
        },
        virtual: {
          slides: pages,
          cache: true,
          renderSlide: index => SwiperSlide(this.renderPage(index)),
        },
        spaceBetween: 10,
        ...swiperOptions,
      });
    });
  }

  set error(value) {
    if (value == null) {
      this._error = '';
    } else {
      this._error = `${this._error} ${value}`;
    }

    this._updateErorrs();
  }

  _updateErorrs() {
    const errorEl = this.element.find('.le-pdf-error');

    if (errorEl.length > 0) {
      errorEl.text(this.error);
    }

    if (this.error === '' || this.error == null) {
      this.element.removeClass('le-pdf--error');
    } else {
      this.element.addClass('le-pdf--error');
    }
  }

  get error() {
    return this._error;
  }

  destroy() {
    $(this.element).replaceWith(this._initialEl);
  }
}

/* global VERSION */
lePdf.version = VERSION;

window.lePdf = lePdf;
