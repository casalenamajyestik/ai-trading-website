export default {
  plugins: {
    'postcss-preset-env': {
      stage: 3,
      features: {
        'media-query-ranges': false, // Disable modern syntax @media (width <= 480px)
        'custom-media-queries': true,
        'nesting-rules': true,
      },
      browsers: [
        '> 0.5%',
        'last 2 versions',
        'not dead',
        'iOS >= 12',
        'Safari >= 12',
        'Chrome >= 70',
        'Firefox >= 65',
        'Edge >= 79'
      ],
    },
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace',
    },
  },
};