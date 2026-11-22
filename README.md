# Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.

This sample plugin demonstrates some of the basic functionality the plugin API can do.

- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open modal (simple)" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and outputs a Notice on click.
- Registers a global interval which logs 'setInterval' to the console.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `src/main.ts` to `main.js`.
- Make changes to `src/main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v18 (`node --version`).
- `npm i` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Fase 1: conexión con Riot API

1. En Obsidian, abre **Ajustes → League of Legends Toolkit**.
2. Introduce tu Riot ID en el formato `Nombre#TAG`, selecciona el servidor y añade tu API key personal de Riot.
3. Ejecuta el comando **Consultar partidas clasificatorias solo/duo recientes** desde la paleta de comandos.

La consulta resuelve la cuenta con Account-V1 y solicita hasta 20 IDs de partidas al Match-V5 usando el filtro oficial de cola `420` (Ranked Solo). La API key se guarda en los datos locales del plugin, se envía únicamente a Riot por HTTPS y no se incluye en notas ni en el código distribuido. Las claves de desarrollo de Riot caducan cada 24 horas; para publicar el producto, registra la aplicación y sigue las políticas vigentes de Riot.

League of Legends Toolkit is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. League of Legends and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## Insertar iconos de campeones

En el editor, haz clic derecho y abre la sección **Insertar** para elegir **Insertar icono de campeón**, **Insertar habilidad de campeón**, **Insertar icono de objeto**, **Insertar icono de hechizo de invocador**, **Insertar icono de runa** o **Configurar runas**. Para objetos, elige primero Español o English; después busca y selecciona uno para insertar su imagen Markdown en la posición del cursor. La opción de runas permite buscar una runa e insertar su icono individual. La opción de habilidades permite elegir un campeón y después insertar el icono de su pasiva o de sus habilidades Q, W, E y R. Si hay objetos repetidos, se conserva el registro con el ID más bajo y se eliminan las etiquetas del nombre. Los hechizos de invocador disponibles son Heal, Ghost, Smite, Barrier, Exhaust, Clarity, Snow Ball, Flash, Teleport, Cleanse e Ignite. El configurador de runas permite crear una página completa en español con dos ramas y los tres fragmentos; se inserta en la nota como una cuadrícula con todos los iconos y las selecciones resaltadas. Para modificarla, haz clic derecho sobre la página en la vista previa y selecciona **Editar página de runas**. Las listas se cargan desde Data Dragon (versión 16.23.1), por lo que se necesita conexión a Internet.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- This project already has eslint preconfigured, you can invoke a check by running`npm run lint`
- Together with a custom eslint [plugin](https://github.com/obsidianmd/eslint-plugin) for Obsidan specific code guidelines.
- A GitHub action is preconfigured to automatically lint every commit on all branches.

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
	"fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
	"fundingUrl": {
		"Buy Me a Coffee": "https://buymeacoffee.com",
		"GitHub Sponsor": "https://github.com/sponsors",
		"Patreon": "https://www.patreon.com/"
	}
}
```

## API Documentation

See https://docs.obsidian.md
