# UI Builder for Azure AD B2C
> Based on Pug and Gulp

## Instructions

### Reference in B2C
1. This project supports loading files served from the dev server in B2C directly, so you can develop in a live environment without needing to upload your files to blob storage!
1. Start the server (using `npm start` like above)
1. Change the `UIBaseUrl` value in your B2C settings to point to `http://localhost:3000`.
1. Build and upload your B2C files to update them with this new value

### Local Development
1. In the root directory, run `npm install`
1. Run `npm start` to start the local development HTTP server (with hot reload!) and queue an initial build.
1. You'll be shown a directory of rendered HTML files that reflect the number of files in your `templates` folder
1. Select one to load the file with hot reload enabled.  If you make any changes to the `.scss` or `.pug` file, that will trigger a refresh
1. You will see a menu injected that allows you to mock B2C's rendering output.  This is useful for working on deep pages like multifactor authentication.
  1. To add a new template, navigate to the page in a live B2C environment and open the inspector.
  1. Find the `#api` element and copy it.
  1. Create a new `.html` file in `src/localBuild/devTemplates` and paste the contents in
  1. Optionally, clean the links of any reference to your tenant as they won't work.

**Features**
- Supports mobile view
- You can show/hide the menu bar using `ctrl-k` on Windows

## Configuration/Variables
Gulp injects the `config.json` file into the Pug build as local variables.  The usage is slightly different depending on which file type you're injecting the variable into:

### In .pug files

These are accessible as:
- Regular JS variables without any notation
- Pug's own `#{variableName}` syntax.  See https://pugjs.org/language/interpolation.html.

### In .scss files

You can use the same config.json file to replace variables in the compiled CSS files.

- Use the syntax `{{variableName}}`
- You could also use SASS native variables (`$varName`)
  - Note that the newer `@use` syntax namespaces the variables, so use `importName.varName`

### Settings List
| Setting  | Description  |
|---|---|
| baseUrl  | The absolute URL of the UI resources that B2C will refer to.  For example, `https://my-storage-account.blob.core.windows.net/container-name`  |
| imageName  | The logo that will be used on multiple pages, including the landing  |
| backgroundName  | The name of the image in the `assets/images` folder that will be used as the background  |
| faviconName | The file name of the favicon that will be used.  E.g. `favicon.ico` |
| defaultScripts | The list of scripts that will be included in every template |
| defaultCss | The list of CSS files that will be included in every template |

## Converting from HTML to Pug
There are many online converters like https://html-to-pug.com/.  If you don't want to give a website the code, you can use a command line tool like https://www.npmjs.com/package/html2pug

## Templating
See Pug's documentation on includes statements: https://pugjs.org/language/includes.html

## Building for production
- You (or the pipeline) can run `npm run build:prod` or `gulp prod` to queue a production build.  This will minify the JavaScript, CSS and images.
- Since B2C needs absolute URLs, you'll have to replace the `baseUrl` value in `config.json` somehow.  We recommend using the "replace tokens" task if you're using Azure Pipelines.
  - The default value to replace is `{Settings:StorageBaseUrl}`

TODO:
- Extract SCSS into modules and partials for easier maintainance
- Mock the B2C `SETTINGS` object to get things like DFP to work locally (or just suppress errors)
- Hide the local dev nav bar
- Misc. display issues
  - Bold everything on the error page, misaligned "clear template" button on the IDP selector...etc

BUGS
- Browsersync local development is case insensitive, while B2C is case sensitive.  This affects loading things like CSS.  Figure out how to get Browsersync to load case-sensitive to match B2C.

## Changelog
- 1/18/22: Fixed hot reload, added CORS support to allow B2C to load files from local dev server, added local mock rendering of B2C content for quicker local development.

## Thanks/Sources

**Code**
- https://pugjs.org/api/getting-started.html
- https://gulpjs.com/
- https://github.com/brianeto/gulp-sass-starter

**Assets**
- Stock photo from [Jesse Collins](https://unsplash.com/@jtc) (IG: @jtc_sea) via Unspalsh: https://unsplash.com/photos/tukk8xRbaeQ
