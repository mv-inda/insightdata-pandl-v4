define([], function () {
    'use strict';
    return {
        type: 'items',
        component: 'accordion',
        items: {
            // configuration: {
            //     component: 'expandable-items',                
            //     label: "Configuration",                        
            //     items: {
            //         selectionFields: {
            //             ref: 'qDef.selectionFields',
            //             label: 'List of dimension fields in the P&L',
            //             type: 'string',
            //             defaultValue: 'Class;Account Group;Account Sub Group;Account',                                
            //             expression: 'optional'
            //         }
            //     }
            // },            
            dimensions: {
                uses: 'dimensions',
                min: 1,
                max: 10,
                items: {
                    CalculateTotal: {
                        ref: 'qOtherTotalSpec.qTotalMode',
                        component: 'switch',
                        type: 'string',
                        label: 'Calculate total expression',
                        options: [{
                            value: 'TOTAL_OFF',
                            label: 'Off'
                        },
                        {
                            value: 'TOTAL_EXPR',
                            label: 'On'
                        }],
                        defaultValue: 'TOTAL_OFF',
                    },
                    totalLabel: {
                        ref: 'qDef.totalLabel',
                        type: 'string',
                        label: 'Total label',
                        expression: 'optional',
                        show: function (e) { return e.qOtherTotalSpec.qTotalMode == 'TOTAL_EXPR' },
                    },
                    showTotalColumn: {
                        ref: 'qDef.showTotalColumn',
                        type: 'string',
                        label: 'Show total (yes or no)',
                        expression: 'optional',
                        defaultValue: 'yes',
                        show: function (e) { return e.qOtherTotalSpec.qTotalMode == 'TOTAL_EXPR' },
                    }
                }
            },
            measures: {
                uses: "measures",
                min: 1,
                max: 20,
                items: {
                    isPercentage: {
                        ref: 'qDef.isPercentage',
                        type: 'boolean',
                        component: 'switch',
                        label: 'Is percentage',
                        defaultValue: false,
                        options: [
                            {
                                value: true,
                                label: 'Yes'
                            },
                            {
                                value: false,
                                label: 'No'
                            }
                        ]
                    },
                    percentageCalcOption: {
                        ref: 'qDef.percentageCalcOption',
                        type: 'string',
                        component: 'dropdown',
                        label: 'Percentage Calculation',
                        options: [{
                            value: 'divide',
                            label: 'Divide by top row'
                        }, {
                            value: 'substract',
                            label: 'Substract previous 2 columns'
                        },
                            , {
                            value: 'do not calculate',
                            label: 'Do not calculate'
                        }]
                    },
                    color_type: {
                        type: "string",
                        component: "buttongroup",
                        label: "Color Type",
                        ref: "qDef.colorType",
                        options: [{
                            value: "non",
                            label: "Non"
                        }, {
                            value: "pos_or_neg",
                            label: "+ or -",
                        }, {
                            value: "exp",
                            label: "Exp.",
                        }],
                        defaultValue: "non"
                    },
                    color_exp: {
                        ref: 'qDef.colorExp',
                        type: 'string',
                        label: 'Color',
                        expression: 'optional',
                        show: function (e) { return e.qDef.colorType === 'exp' },
                    },
                    color_reverse: {
                        ref: 'qDef.colorReverse',
                        type: 'boolean',
                        component: 'switch',
                        label: 'Reverse color',
                        defaultValue: false,
                        show: function (e) { return e.qDef.colorType == 'pos_or_neg' },
                        options: [
                            {
                                value: true,
                                label: 'Yes'
                            },
                            {
                                value: false,
                                label: 'No'
                            }
                        ]
                    },
                    pos_color: {
                        ref: 'qDef.posColor',
                        type: 'string',
                        defaultValue: '#b2df8a',
                        label: 'Positive color',
                        show: function (e) { return e.qDef.colorType === 'pos_or_neg' },
                    },
                    neg_color: {
                        ref: 'qDef.negColor',
                        type: 'string',
                        defaultValue: '#fb9a99',
                        label: 'Negative color',
                        show: function (e) { return e.qDef.colorType == 'pos_or_neg' },
                    }
                }
            },
            sorting: {
                uses: "sorting"
            },
            addons: {
                uses: "addons",
                items: {
                    dataHandling: {
                        uses: "dataHandling"
                    },
                    additionalCalculations: {
                        type: "items",
                        label: "Additional calculations",
                        items: {
                            percentageLineBase: {
                                ref: 'qDef.percentageLineBase',
                                type: 'string',
                                defaultValue: '',
                                label: 'Percentage Line Base (defaults to first line if blank)',
                                expression: 'optional'
                            },
                            percentageLineDims: {
                                ref: 'qDef.percentageLineDims',
                                type: 'string',
                                defaultValue: '',
                                label: 'Percentage Line Dims',
                                expression: 'optional'
                            },
                            percentageLocale: {
                                ref: 'qDef.percentageLocale',
                                type: 'string',
                                defaultValue: 'nl-BE',
                                label: 'Percentage Locale'
                            },
                            percentageNoOfDecimals: {
                                ref: 'qDef.percentageNoOfDecimals',
                                type: 'integer',
                                defaultValue: 2,
                                label: 'Percentage Number of Decimals'
                            }
                        }
                    },
                    visibility: {
                        type: "items",
                        label: "Visibility",
                        items: {
                            collapsedLevels: {
                                ref: 'qDef.collapsedLevels',
                                type: 'string',
                                defaultValue: '',
                                label: 'Collapsed Levels',
                                expression: 'optional'
                            },
                            expandedDims: {
                                ref: 'qDef.expandedDims',
                                type: 'string',
                                defaultValue: '',
                                label: 'Expanded Dims',
                                expression: 'optional'
                            },
                            collapsedDims: {
                                ref: 'qDef.collapsedDims',
                                type: 'string',
                                defaultValue: '',
                                label: 'Collapsed Dims',
                                expression: 'optional'
                            }
                        }
                    },
                    styling: {
                        type: "items",
                        label: "Styling",
                        items: {
                            percentageBaseRowStyle: {
                                ref: 'qDef.percentageBaseRowStyle',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: 'font-weight: bold;\nborder-bottom: 2px solid #ff7f00 !important;\nbackground-color: #f5f5f5',
                                label: 'Percentage Line Base Row Style (first row when Percentage Line Base is blank)',
                                expression: 'optional'
                            },
                            baseRowStyle: {
                                ref: 'qDef.baseRowStyle',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: '',
                                label: 'Base Row Style',
                                expression: 'optional'
                            },
                            sumRowStyle: {
                                ref: 'qDef.sumRowStyle',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: 'font-weight: bold;\nborder-bottom: 1px solid #ff7f00 !important;\nbackground-color: #f5f5f5',
                                label: 'Sum Row Style',
                                expression: 'optional'
                            },
                            percentageRowStyle: {
                                ref: 'qDef.percentageRowStyle',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: 'font-weight: bold;\nfont-style: italic;\nborder-bottom: 2px solid #ff7f00 !important;\nbackground-color:  #f5f5f5;',
                                label: 'Percentage Row Style',
                                expression: 'optional'
                            },                           
                            rowLevel1Style: {
                                ref: 'qDef.rowLevel1Style',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: '',
                                label: 'Row Style Level 1',
                                expression: 'optional'
                            },
                            rowLevel2Style: {
                                ref: 'qDef.rowLevel2Style',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: '',
                                label: 'Row Style Level 2',
                                expression: 'optional'
                            },
                            rowLevel3Style: {
                                ref: 'qDef.rowLevel3Style',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: '',
                                label: 'Row Style Level 3',
                                expression: 'optional'
                            },
                            rowLevel4Style: {
                                ref: 'qDef.rowLevel4Style',
                                type: 'string',
                                component: 'textarea',
                                rows: 4,
                                defaultValue: '',
                                label: 'Row Style Level 4',
                                expression: 'optional'
                            },
                        }
                    },
                    customStyles: {
                        type: 'array',
                        label: 'Custom Row Styles',
                        ref: 'qDef.customStyles',
                        itemTitleRef: 'dims',
                        allowAdd: true,
                        allowRemove: true,
                        addTranslation: "Add Style",
                        items: {
                            dims: {
                                type: 'string',
                                label: 'Dims (seperated with ;)',
                                ref: 'dims',
                                defaultValue: '',
                                expression: 'optional'
                            },
                            style: {
                                type: 'string',
                                label: 'Style',
                                ref: 'style',
                                defaultValue: '',
                                expression: 'optional'
                            }
                        }
                    }
                }
            },
            appearancePanel: {
                uses: 'settings'
            }
        }
    }
});