import { availableSystemProviders, currentSystemProvider, getDefaultSystemProvider, updateSystemProvider } from "./api.js"

const debouncedReload = foundry.utils.debounce(() => {
	window.location.reload();
}, 100);

export function registerSettings() {
	game.settings.registerMenu("party-overview", "PartyOverviewSystemSettings", {
		name: "Party Overview System Settings",
		label: "Party Overview System Settings",
		icon: "fas fa-users",
		type: SystemProviderSettings,
		restricted: true
	});
	game.settings.register("party-overview", "EnablePlayerAccess", {
		name: game.i18n.localize(`party-overview.EnablePlayerAccess.Name`),
		hint: game.i18n.localize(`party-overview.EnablePlayerAccess.Hint`),
		scope: "world",
		default: true,
		config: true,
		type: Boolean
	})
	game.settings.register("party-overview", "systemProvider", {
		scope: "world",
		config: false,
		type: String,
		default: getDefaultSystemProvider(),
		onChange: updateSystemProvider
	})
}

export class SystemProviderSettings extends FormApplication {

	constructor(object, options = {}) {
		super(object, options);
	}

	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'party-overview-form',
			title: 'Party Overview System Settings',
			template: './modules/party-overview/templates/SystemProviderSettings.hbs',
			classes: ['sheet'],
			width: 600,
			closeOnSubmit: true
		});
	}

	getData(options) {
		const data = {};
		const selectedProvider = currentSystemProvider.id;
		// Insert all speed providers into the template data
		data.providers = Object.values(availableSystemProviders).map(systemProvider => {
			const provider = {}
			provider.id = systemProvider.id
			let dotPosition = provider.id.indexOf(".")
			if (dotPosition === -1)
				dotPosition = provider.id.length
			const type = provider.id.substring(0, dotPosition)
			const id = provider.id.substring(dotPosition + 1)
			if (type === "native") {
				let title = id == game.system.id ? game.system.data.title : id;
				provider.selectTitle = (game.i18n.localize("party-overview.SystemProvider.choices.native") + " " + title).trim();
			}
			else {
				let name
				if (type === "module") {
					name = game.modules.get(id).data.title
				}
				else {
					name = game.system.data.title
				}
				provider.selectTitle = game.i18n.format(`party-overview.SystemProvider.choices.${type}`, {name})
			}
			provider.isSelected = provider.id === selectedProvider
			return provider
		})

		data.providerSelection = {
			id: "systemProvider",
			name: game.i18n.localize("party-overview.SystemProvider.Name"),
			hint: game.i18n.localize("party-overview.SystemProvider.Hint"),
			type: String,
			choices: data.providers.reduce((choices, provider) => {
				choices[provider.id] = provider.selectTitle
				return choices
			}, {}),
			value: selectedProvider,
			isCheckbox: false,
			isSelect: true,
			isRange: false,
		}

		return {data};
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find('button').on('click', async (event) => {
			if (event.currentTarget?.dataset?.action === 'reset') {
				game.settings.settings.get("party-overview.systemProvider").default = getDefaultSystemProvider();
				debouncedReload();
			}
		});
	}

	/**
	 * Executes on form submission
	 * @param {Event} ev - the form submission event
	 * @param {Object} formData - the form data
	 */
	async _updateObject(ev, formData) {
		game.settings.set("party-overview", "systemProvider", formData.systemProvider);
		updateSystemProvider();
	}
}