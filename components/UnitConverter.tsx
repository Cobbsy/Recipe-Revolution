import React, { useState } from 'react';
import { convertUnits } from '../services/geminiService';
import { ScaleIcon } from './icons/ScaleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

const UnitConverter: React.FC = () => {
    const [value, setValue] = useState<string>('1');
    const [fromUnit, setFromUnit] = useState<string>('cups');
    const [toUnit, setToUnit] = useState<string>('grams');
    const [result, setResult] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleConvert = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue <= 0) {
            setError('Please enter a valid positive number.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const conversionResult = await convertUnits(numericValue, fromUnit, toUnit);
            setResult(conversionResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const commonUnits = {
        Volume: ['cups', 'tablespoons', 'teaspoons', 'milliliters', 'liters', 'fluid ounces'],
        Weight: ['grams', 'kilograms', 'ounces', 'pounds'],
        Temperature: ['Celsius', 'Fahrenheit'],
    };

    return (
        <details className="mt-10 pt-6 border-t border-gray-200" open>
            <summary className="flex items-center justify-center gap-2 text-xl font-bold mb-4 text-center text-gray-800 cursor-pointer">
                <ScaleIcon className="w-6 h-6 text-gray-500" />
                Unit Converter
            </summary>
            <div className="max-w-md mx-auto p-4 bg-gray-50 rounded-lg">
                <form onSubmit={handleConvert} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                    <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700">Value</label>
                        <input
                            id="value"
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:border-orange-400"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="fromUnit" className="block text-sm font-medium text-gray-700">From</label>
                        <select
                            id="fromUnit"
                            value={fromUnit}
                            onChange={(e) => setFromUnit(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:border-orange-400"
                        >
                            {Object.entries(commonUnits).map(([group, units]) => (
                                <optgroup label={group} key={group}>
                                    {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="toUnit" className="block text-sm font-medium text-gray-700">To</label>
                        <select
                            id="toUnit"
                            value={toUnit}
                            onChange={(e) => setToUnit(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:border-orange-400"
                        >
                            {Object.entries(commonUnits).map(([group, units]) => (
                                <optgroup label={group} key={group}>
                                    {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300">
                            {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Convert'}
                        </button>
                    </div>
                </form>

                {(result !== null || error) && (
                    <div className="mt-4 p-3 rounded-md bg-white border border-gray-200 text-center">
                        {error && <p className="text-red-600">{error}</p>}
                        {result !== null && (
                            <p className="text-lg font-semibold text-gray-800">
                                Result: <span className="text-orange-600">{result.toFixed(2)} {toUnit}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </details>
    );
};

export default UnitConverter;
