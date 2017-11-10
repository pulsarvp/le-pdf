# le-pdf

> le-pdf - it is pdf viewer based on PDFjs and Swiper.js

## Usage

```HTML
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/4.0.2/css/swiper.min.css"  crossorigin="anonymous"/>
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@1.9.648/build/pdf.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/4.0.2/js/swiper.js"></script>

    <div id="pdf"></div>
    <script>
      var pdfCarousel = new lePdf(document.getElementById('pdf'), {
        url: './some.pdf',
      })
    </script>

```

## Documentation

lePdf takes two arguments, `{jQuery|HTMLElement} element` and `{Object} options`;

 * `{String} [options.direction='horizontal']` Could be 'horizontal' or 'vertical'.
 * `{String} [options.url]` Url to pdf document
 * `{Number|String} [options.width]` Width of slider
 * `{Function} [options.onInit]` On init callback


