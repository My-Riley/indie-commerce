import { 
  VendurePlugin, 
  ShippingEligibilityChecker, 
  LanguageCode, 
  RequestContext, 
  Order, 
  Injector, 
  CountryService,
  FacetValueChecker,
  OrderService,
  assertFound
} from '@vendure/core';
import { PluginCommonModule } from '@vendure/core';
import { isEligibleForCountry } from '@pinelab/vendure-plugin-shipping-extensions/dist/config/shipping/shipping-util';
import { ShippingExtensionsPlugin } from './shipping-extensions-plugin';

let injector: Injector;

export const customFacetAndCountryChecker = new ShippingEligibilityChecker({
    code: 'custom-shipping-by-facets-and-country',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Check by facets and country',
        },
    ],
    args: {
        facets: {
            type: 'ID',
            list: true,
            label: [{ languageCode: LanguageCode.en, value: `Facets` }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: `All items in order should have all of the facets`,
                },
            ],
            ui: {
                component: 'facet-value-form-input',
            },
        },
        countries: {
            type: 'string',
            list: true,
            ui: {
                component: 'select-form-input',
                options: [],
            },
        },
        excludeCountries: {
            type: 'boolean',
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Eligible for all countries except the ones listed above',
                },
            ],
            ui: {
                component: 'boolean-form-input',
            },
        },
    },
    async init(_injector) {
        injector = _injector;
        const ctx = RequestContext.empty();
        // Populate the countries arg list
        const countryService = injector.get(CountryService);
        const countries = await countryService.findAll(ctx);
        this.args.countries.ui.options = countries.items.map((c: any) => ({
            value: c.code,
            label: [
                {
                    languageCode: LanguageCode.en,
                    value: c.name,
                },
            ],
        })) as any;
    },
    async check(ctx, _order, { facets, countries, excludeCountries }, method) {
        const isEligibleByCountry = isEligibleForCountry(_order, countries, excludeCountries);
        if (isEligibleByCountry === false) {
            return false;
        }
        
        // Shipping country is allowed, continue checking facets
        // Fix for test shipping method: use the order directly if it doesn't have an ID (test order)
        let hydratedOrder = _order;
        if (_order.id) {
            try {
                const orderService = injector.get(OrderService);
                const foundOrder = await orderService.findOne(ctx, _order.id, [
                    'lines',
                    'lines.productVariant',
                    'lines.productVariant.product',
                ]);
                if (foundOrder) {
                    hydratedOrder = foundOrder;
                }
            } catch (error) {
                // If we can't hydrate the order (e.g., in test mode), use the order as-is
                hydratedOrder = _order;
            }
        }

        // Check if all lines have the required facets
        for (const line of hydratedOrder.lines) {
            const hasFacetValues = await injector
                .get(FacetValueChecker)
                .hasFacetValues(line, facets);
            if (!hasFacetValues) {
                // One of the lines doesn't have the facetValue, no need to check any more
                return false;
            }
        }
        
        // Check for additional consumer provided isEligible check as final option to block eligibility
        const additionalIsEligible = await ShippingExtensionsPlugin.options?.additionalShippingEligibilityCheck?.(ctx, injector, hydratedOrder, method);
        if (additionalIsEligible === false) {
            return false;
        }
        
        return true;
    },
});

@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: (config) => {
        // Remove the original facetAndCountryChecker and add our custom checker
        config.shippingOptions.shippingEligibilityCheckers = config.shippingOptions.shippingEligibilityCheckers.filter(
            checker => checker.code !== 'shipping-by-facets-and-country'
        );
        config.shippingOptions.shippingEligibilityCheckers.push(customFacetAndCountryChecker);
        
        return config;
    },
    compatibility: '>=2.2.0',
})
export class FacetAndCountryCheckerPlugin {
    static init() {
        return FacetAndCountryCheckerPlugin;
    }
}