const webpack = require('webpack');
const path = require('path');
const UglyJs = require('webpack-uglify-js-plugin');


module.exports = {

    entry: {
        // admin: path.join(__dirname, 'Admin/client/index.js'),
        bundle: path.join(__dirname, 'client/index.js')
    },

    output: {
        path: path.join(__dirname, 'production/client/static'),
        publicPath:  '/',
        filename: '[name].js'
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            },

            {
                test: /\.sass$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']

            },

            {
                test: /(.woff2|.woff|.eot|.ttf|.otf|.wav)$/,
                loader: 'url-loader',
                query: {
                    limit: 10000
                }
            },

            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loaders: 'babel-loader'
            },

            {
                test: /\.(gif|png|jpeg|jpg|svg)$/i,
                loaders: [ {
                    loader: 'url-loader',
                    query: {
                        limit: 10000
                    }
                     },

                    {
                        loader: 'image-webpack-loader',
                        query: {
                            progressive: true,
                            optimizationLevel: 7,
                            interlaced: false,

                            mozjpeg: {
                                quality: 65
                            },

                            pngquant:{
                                quality: "65-90",
                                speed: 4
                            },

                            svgo:{
                                plugins: [
                                    {
                                        removeViewBox: false
                                    },
                                    {
                                        removeEmptyAttrs: false
                                    }
                                ]
                            },



                        },
                    }
                ]
            },

        ]
    },

    plugins: [
        // new BundleAnalyzerPlugin(),
        new UglyJs({
            cacheFolder: path.resolve(__dirname, 'public/cached_uglify/'),
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.ProvidePlugin({
            'React': 'react',
            "createReactClass": "create-react-class",
            "PropTypes": "prop-types"
        })
    ],

    resolve: {
        extensions: ['.js', '.jsx']
    }
}