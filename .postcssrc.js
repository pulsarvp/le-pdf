// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  parser: 'postcss-scss',
  plugins: {
    'precss' : {},
    'postcss-flexbugs-fixes': {},
    'postcss-inline-svg': {},
    'postcss-hexrgba': {},
    'postcss-calc': {},
    'postcss-url' : { url : 'inline' },
    'autoprefixer': {},
  }
}
