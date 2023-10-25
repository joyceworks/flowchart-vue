module.exports = {
  runtimeCompiler: true,
  css: {
    loaderOptions: {
      less: {
        modifyVars: {},
      },
      postcss: {
        plugins: [],
      },
    },
    extract: false,
  },
  baseUrl: process.env.NODE_ENV === "production" ? "/flowchart-vue" : "/"
};
