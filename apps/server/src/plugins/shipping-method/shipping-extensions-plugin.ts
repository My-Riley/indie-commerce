import { VendurePlugin, PluginCommonModule } from '@vendure/core';
import { customWeightAndCountryChecker } from './weight-and-country-checker';
import { customFacetAndCountryChecker } from './facet-and-country-checker';
import { customDistanceBasedShippingCalculator } from './distance-based-shipping-calculator';
import { UKPostalCodeToGelocationConversionStrategy } from '@pinelab/vendure-plugin-shipping-extensions/dist/strategies/uk-postalcode-to-geolocation-strategy';

@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: (config) => {
        // Remove the original weightAndCountryChecker and add our custom checker
        config.shippingOptions.shippingEligibilityCheckers = config.shippingOptions.shippingEligibilityCheckers.filter(
            checker => checker.code !== 'shipping-by-weight-and-country'
        );
        config.shippingOptions.shippingEligibilityCheckers.push(customWeightAndCountryChecker);
        
        // Remove the original facetAndCountryChecker and add our custom checker
        config.shippingOptions.shippingEligibilityCheckers = config.shippingOptions.shippingEligibilityCheckers.filter(
            checker => checker.code !== 'shipping-by-facets-and-country'
        );
        config.shippingOptions.shippingEligibilityCheckers.push(customFacetAndCountryChecker);
        
        // Remove the original distanceBasedShippingCalculator and add our custom calculator
        config.shippingOptions.shippingCalculators = config.shippingOptions.shippingCalculators.filter(
            calculator => calculator.code !== 'distance-based-shipping-calculator'
        );
        config.shippingOptions.shippingCalculators.push(customDistanceBasedShippingCalculator);
        
        return config;
    },
    compatibility: '>=2.2.0',
})
export class ShippingExtensionsPlugin {
    static options: any;
    
    static init(options?: any) {
        // Set default options if not provided
        this.options = {
            weightUnit: 'grams',
            orderAddressToGeolocationStrategy: new UKPostalCodeToGelocationConversionStrategy(),
            ...options
        };
        return ShippingExtensionsPlugin;
    }
}