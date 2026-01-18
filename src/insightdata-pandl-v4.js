define(['qlik', 'jquery', './properties', './style.css'],
    function (qlik, $, properties, cssContent) {
        'use strict';

        return {
            initialProperties: {
                qHyperCubeDef: {
                    qMode: 'P',
                    qNoOfLeftDims: 7,
                    qAlwaysFullyExpanded: true,
                    qShowTotalsAbove: true,
                    qDimensions: [],
                    qMeasures: [],
                    qInitialDataFetch: [{
                        qWidth: 100,
                        qHeight: 10000
                    }]
                }
            },
            snapshot: {
                canTakeSnapshot: true
            },
            support: {
                exportData: true
            },
            definition: properties,

            // controller: ['$scope', function($scope, $element) {
            //     console.log($scope.ext);
            //     console.log($scope.layout);          
            // }],

            paint: function ($element, layout) {
                //console.log(layout);
                var id = layout.qInfo.qId + '_indapl';
                //console.log('P&L ID:' + id);
                let app = qlik.currApp(this);
                let backendApi = this.backendApi;


                /* Get Current selection fields */
                let fieldName = layout.qHyperCube.qDimensionInfo[5].qFallbackTitle;
                //console.log(fieldName);

                app.createGenericObject({
                    fields: { qStringExpression: "=concat(DISTINCT [" + fieldName + "],';')" },
                },
                    function (reply) {
                        try {
                            let selectionFields = reply.fields.split(';');
                            //console.log(selectionFields);
                            app.destroySessionObject(reply.qInfo.qId); /* if not destroyed new object will be made ith each paint */

                            /* Check if we have state array if not create*/
                            let rowStateId = id + '_row_state';
                            //console.log('rowStateId: ' + rowStateId);

                            if (!app.hasOwnProperty(rowStateId)) {
                                app[rowStateId] = [];
                            }
                            var rowStates = app[rowStateId];

                            /* Function to format percentage calculation */
                            const percentageFormat = Intl.NumberFormat(layout.qDef.percentageLocale, {
                                style: 'percent',
                                minimumFractionDigits: layout.qDef.percentageNoOfDecimals,
                                maximumFractionDigits: layout.qDef.percentageNoOfDecimals
                            })

                            function getCellColor(value,
                                sign,
                                colortype,
                                colorReverse,
                                mPosColor,
                                mNegColor,
                                colorExp,
                                isPercentage = false) {
                                if (colortype == 'non' || value === undefined) {
                                    return '';
                                } else if (colortype == 'pos_or_neg') {
                                    let posColor, negColor;
                                    if (!colorReverse) {
                                        posColor = mPosColor;
                                        negColor = mNegColor;
                                    } else {
                                        posColor = mNegColor;
                                        negColor = mPosColor;
                                    }
                                    if (isPercentage == false) {
                                        return (value >= 0 && sign == 'Positive') || (value >= 0 && sign == 'Negative') ? posColor : negColor;
                                    } else {
                                        return (value <= 0 && sign == 'Negative') || (value >= 0 && sign == 'Positive') ? posColor : negColor;
                                    }
                                } else if (colortype == 'exp') {
                                    return colorExp;
                                }
                            }

                            /* See if selections are made on fields in the reporting class if so we don't need to show summary reporting classes */
                            let reportingClassHasSelections = false;
                            app.selectionState().selections.forEach(function (e) {
                                if (selectionFields.includes(e.fieldName)) {
                                    reportingClassHasSelections = true;
                                }
                            });


                            /* Custom Styles */
                            //console.log('Custom Styles def:', layout.qDef.customStyles);
                            const customStyleMap = (layout.qDef.customStyles ?? [])
                                .flatMap(({ dims, style }) =>
                                    String(dims ?? "")
                                        .split(";")
                                        .map(s => s.trim())
                                        .filter(Boolean)
                                        .map(dimTxt => {
                                            const dimKey = dimTxt
                                                .toLowerCase()
                                                .replace(/\s+/g, "_")
                                                .replace(/[^a-z0-9_-]/g, "");
                                            return [dimTxt, { dimKey, style }];
                                        })
                                )
                                .reduce((acc, [dimTxt, payload]) => ((acc[dimTxt] = payload), acc), {});
                            //console.log("Custom Styles Map", customStyleMap);
                            const customStylesCss = Object.entries(customStyleMap)
                                .map(([dimTxt, { dimKey, style }]) => {
                                    return `.qv-object-insightdata-pandl-v4 .inda_pandl_dim_${dimKey}_${id} td{${style}}`;
                                })
                                .join("\n");


                            /* Add style */
                            let styleID = id + '_style';
                            let $style
                            $style = $('#' + styleID);
                            if ($style.length == 0) {
                                $style = $(document.createElement('style'));
                                $style.attr('id', styleID);
                                $style.appendTo('head');
                                $style.attr('type', 'text/css');
                            }
                            $style.text(`
                        .qv-object-insightdata-pandl-v4 .inda_pandl_percentage_base_row_${id} td {
                            `+ layout.qDef.percentageBaseRowStyle + `
                        }
                        .qv-object-insightdata-pandl-v4 .inda_pandl_base_row_${id} td {
                            `+ layout.qDef.baseRowStyle + `
                        }
                        .qv-object-insightdata-pandl-v4 .inda_pandl_sum_row_${id} td{
                            `+ layout.qDef.sumRowStyle + `
                        }
                        .qv-object-insightdata-pandl-v4 .inda_pandl_percentage_row_${id} td{
                            `+ layout.qDef.percentageRowStyle + `
                        }                       
                        .qv-object-insightdata-pandl-v4 .inda_pandl_total_column_${id} td {
                            `+ layout.qDef.totalColumnStyle + `
                        }
                        .qv-object-insightdata-pandl-v4 .inda_pandl_row_level_1_${id} td {
                            `+ layout.qDef.rowLevel1Style + `
                        } 
                        .qv-object-insightdata-pandl-v4 .inda_pandl_row_level_2_${id} td {
                            `+ layout.qDef.rowLevel2Style + `
                        } 
                        .qv-object-insightdata-pandl-v4 .inda_pandl_row_level_3_${id} td {
                            `+ layout.qDef.rowLevel3Style + `
                        } 
                        .qv-object-insightdata-pandl-v4 .inda_pandl_row_level_4_${id} td {
                            `+ layout.qDef.rowLevel4Style + `
                        }
                        /* Custom Styles */
                        ${customStylesCss}                
                        `);

                            //var $table_cont = $(document.createElement('div'));                
                            //$table_cont.attr('id',id);
                            var $table = $(document.createElement('table'));
                            $table.attr('id', id);

                            /* Create header */
                            var $header = $(document.createElement('thead'));

                            var headerRows = [];

                            /* Create initial header */
                            headerRows[0] = $(document.createElement('tr'));

                            /* Create header column for first dimension column */
                            var $headerDim = $(document.createElement('th'));
                            $headerDim.append(
                                $(document.createElement('i')).prop({
                                    class: 'inda_pandl_download item-icon lui-icon lui-icon--download',
                                    style: 'float: left;'
                                })
                            );
                            $headerDim.append($(document.createElement('span')).text(layout.qHyperCube.qDimensionInfo[1].qFallbackTitle));



                            var headerDimRowspan = layout.qHyperCube.qDimensionInfo.length - layout.qHyperCube.qNoOfLeftDims + (layout.qHyperCube.qMeasureInfo.length > 1 ? 1 : 0);
                            $headerDim.attr('rowspan', headerDimRowspan);
                            headerRows[0].append($headerDim);


                            /* headerCell Object to store header logic*/
                            class HeaderCell {
                                constructor(level, text, type, dimNo, elemNo) {
                                    this.level = level;
                                    this.text = text;
                                    this.type = type;
                                    this.dimNo = dimNo;
                                    this.elemNo = elemNo

                                    this.childs = [];
                                }

                                addChild(child) {
                                    this.childs.push(child);
                                }

                                hasChilderen() {
                                    return this.childs.length > 0 ? true : false;
                                }

                                countLowestChilds() {
                                    let childCounter = 0;
                                    this.childs.forEach(function (child, childIndex) {
                                        if (child.hasChilderen()) {
                                            childCounter += child.countLowestChilds()
                                        } else {
                                            childCounter += 1;
                                        }
                                    });
                                    return childCounter;
                                }
                            }

                            var headerCells = []; /* to store all header cells */
                            var columnsToHide = []; /* array to story which columns to hide */
                            let levelColumnCounter = []; /* array to count the columns for each level */

                            /* loop over qtop */
                            layout.qHyperCube.qPivotDataPages[0].qTop.forEach(function (data) {
                                createHeaderCells(data, 0)
                            });


                            function createHeaderCells(data, level, parentColumnVisible = undefined, parentqType = undefined, parentHeaderCell = undefined) {
                                let dimNo = layout.qHyperCube.qNoOfLeftDims + level;
                                let qType = data.qType;
                                let text = qType == 'T' ? layout.qHyperCube.qDimensionInfo[dimNo].totalLabel : data.qText;

                                if (levelColumnCounter.hasOwnProperty(level)) {
                                    levelColumnCounter[level] += 1;
                                } else {
                                    levelColumnCounter[level] = 0;
                                }

                                //console.log('level',level,'levelColumnCounter',levelColumnCounter[level],'qType',data.qType,'parentColumnVisible',parentColumnVisible,'parentqType',parentqType,levelColumnCounter[level],'dimNo',dimNo,'dim',layout.qHyperCube.qDimensionInfo[dimNo].qFallbackTitle,'field',text,'showTotalColumn',layout.qHyperCube.qDimensionInfo[dimNo].showTotalColumn);
                                let columnVisible;
                                if (parentColumnVisible == false) {
                                    columnVisible = false;
                                } else {
                                    if (qType == 'T') {
                                        if (parentqType == 'T') {
                                            columnVisible = true;
                                        } else if (layout.qHyperCube.qDimensionInfo[dimNo].showTotalColumn == 'yes') {
                                            columnVisible = true;
                                        } else {
                                            columnVisible = false;
                                        }
                                    } else {
                                        columnVisible = true;
                                    }
                                }

                                if (columnVisible) {
                                    var headerCell = new HeaderCell(level, text, data.qType, dimNo, data.qElemNo);
                                    if (parentHeaderCell) {
                                        parentHeaderCell.addChild(headerCell);
                                    }
                                    headerCells.push(headerCell);
                                } else {
                                    if (!columnsToHide.includes(levelColumnCounter[level])) {
                                        columnsToHide.push(levelColumnCounter[level]);
                                    }
                                }

                                /* Check if there are sub nodes */
                                if (data.qSubNodes.length > 0) {
                                    data.qSubNodes.forEach(function (data) {
                                        createHeaderCells(data, level + 1, columnVisible, qType, headerCell);
                                    });
                                }
                            }

                            /* loop over headerCells to create html elements */
                            headerCells.forEach(function (h) {
                                /* check to see if we need to create new row */
                                if (!headerRows.hasOwnProperty(h.level)) {
                                    headerRows[h.level] = $(document.createElement('tr'));
                                }

                                let $headercell = $(document.createElement('th')).text(h.text);
                                $headercell.attr('colspan', h.countLowestChilds());

                                if (h.type == 'N') { /* to exclude selections on total columns or on measure columns */
                                    $headercell.addClass('inda_pandl_head_selectable');
                                    $headercell.attr('inda_pandl_dim_no', h.dimNo);
                                    $headercell.attr('inda_pandl_elem_no', h.elemNo);
                                }
                                headerRows[h.level].append($headercell);
                            });

                            /* Add header rows to header */
                            headerRows.forEach(function (row) {
                                $header.append(row);
                            });

                            /* Add header to table */
                            $table.append($header);

                            /* read qdef to collapse or not */
                            let collapsedLevels = layout.qDef.collapsedLevels.split(';');
                            let expandedDims = layout.qDef.expandedDims.split(';');
                            let collapsedDims = layout.qDef.collapsedDims.split(';');

                            let percentageLineBase = layout.qDef.percentageLineBase;
                            let percentageLineBaseIndex = !percentageLineBase ? 0 : undefined;

                            let percentageLineDims = layout.qDef.percentageLineDims.split(';');

                            /* Build the actual table */
                            var $body = $(document.createElement('tbody'));

                            var childVisibility = 'show';

                            /* Loop over the rows */
                            layout.qHyperCube.qPivotDataPages[0].qData.forEach(function (qDataRow, rowIndex, qData) {
                                /* rp = reporting */
                                let rpDim = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qText;
                                let rpDimTxt = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qSubNodes[0].qText;
                                let rpLevel = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qSubNodes[0].qSubNodes[0].qText;
                                let rpNextLevel;
                                if (layout.qHyperCube.qPivotDataPages[0].qLeft.length > rowIndex + 1) {
                                    rpNextLevel = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex + 1].qSubNodes[0].qSubNodes[0].qText;
                                } else {
                                    rpNextLevel = undefined;
                                }
                                let rpType = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qSubNodes[0].qSubNodes[0].qSubNodes[0].qText;
                                let rpSign = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qSubNodes[0].qSubNodes[0].qSubNodes[0].qSubNodes[0].qText;
                                let rpField = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qSubNodes[0].qSubNodes[0].qSubNodes[0].qSubNodes[0].qSubNodes[0].qText;
                                let rpParent = layout.qHyperCube.qPivotDataPages[0].qLeft[rowIndex].qSubNodes[0].qSubNodes[0].qSubNodes[0].qSubNodes[0].qSubNodes[0].qSubNodes[0].qText;

                                if (!rowStates.hasOwnProperty(rpDim)) {
                                    rowStates[rpDim] = [];
                                }

                                rowStates[rpDim]['level'] = rpLevel;
                                rowStates[rpDim]['parent'] = rpParent;

                                if (percentageLineBase === rpDimTxt) {
                                    percentageLineBaseIndex = rowIndex;
                                    //console.log('percentageLineBase:', percentageLineBase,'index:',percentageLineBaseIndex);
                                }

                                // console.log('rowIndex:' + rowIndex + ' rpDim: ' + rpDim + ' | rpLevel: ' + rpLevel + ' | rpSign: ' + rpSign + ' | rpParent: ' + rpParent);

                                /* Set rowState */
                                /* expanded or collapsed */
                                if (!rowStates[rpDim].hasOwnProperty('expanded')) {
                                    if (collapsedLevels.includes(rpLevel) || collapsedDims.includes(rpDimTxt)) {
                                        rowStates[rpDim]['expanded'] = false;
                                    } else {
                                        rowStates[rpDim]['expanded'] = true;
                                    }
                                    if (expandedDims.includes(rpDimTxt)) {
                                        rowStates[rpDim]['expanded'] = true;
                                    }
                                }

                                /* visible or not */
                                rowStates[rpDim]['visibile'] = true;
                                if (rowStates.hasOwnProperty(rpParent) && (rowStates[rpParent]['expanded'] == false || rowStates[rpParent]['visibile'] == false)) {
                                    rowStates[rpDim]['visibile'] = false;
                                }

                                if (!(reportingClassHasSelections && rpType == 'Sum')) {

                                    var $bodyrow = $(document.createElement('tr'));
                                    $bodyrow.attr('inda_pandl_dim', rpDim);
                                    $bodyrow.attr('inda_pandl_parent', rpParent);

                                    const customStyleEntry = customStyleMap[String(rpDimTxt ?? "").trim()];
                                    if (customStyleEntry) {
                                        $bodyrow.addClass(`inda_pandl_dim_${customStyleEntry.dimKey}_${id}`);
                                    }

                                    if (rowIndex == percentageLineBaseIndex) {
                                        $bodyrow.addClass('inda_pandl_percentage_base_row_' + id)
                                    } else if (rpType == 'Base') {
                                        $bodyrow.addClass('inda_pandl_base_row_' + id)
                                    } else if (rpType == 'Sum') {
                                        $bodyrow.addClass('inda_pandl_sum_row_' + id)
                                    }

                                    $bodyrow.addClass('inda_pandl_row_level_' + rpLevel + '_' + id);

                                    /* First column */
                                    var $bodycell = $(document.createElement('td'));
                                    var $togglerDiv = $(document.createElement('div'));
                                    $togglerDiv.addClass('inda_pandl_row_toggler_cont');
                                    $togglerDiv.css('width', 15 * rpLevel);

                                    /* Add toggler */
                                    if (rpNextLevel > rpLevel) {
                                        var $toggler = $(document.createElement('i'))
                                        $toggler.addClass('inda_pandl_row_toggler');
                                        $toggler.addClass('qv-pt-expandable lui-icon');
                                        rowStates[rpDim]['expanded'] ? $toggler.addClass('lui-icon--minus') : $toggler.addClass('lui-icon--plus');
                                        $toggler.attr('inda_pandl_dim', rpDim);
                                        $togglerDiv.append($toggler)
                                    }

                                    $bodycell.append($togglerDiv)

                                    /* Dim */
                                    var $bodycellDiv = $(document.createElement('div'));
                                    $bodycellDiv.addClass('inda_pandl_row_selectable');
                                    //$bodycellDiv.attr("inda_pandl_dim_col",0); /* 0 for always the first dimension */
                                    //$bodycellDiv.attr("inda_pandl_dim_elem_no",rpDimeElemNo);
                                    $bodycellDiv.attr("inda_pandl_dim_field", rpField);
                                    $bodycellDiv.text(rpDimTxt);
                                    $bodycell.append($bodycellDiv);

                                    /* Add Cell to table */
                                    $bodyrow.append($bodycell);

                                    /* Actual Data */
                                    qDataRow.forEach(function (qDataColumn, columnIndex) {
                                        if (!columnsToHide.includes(columnIndex)) {
                                            let measureIndex = columnIndex % layout.qHyperCube.qMeasureInfo.length;
                                            let measure = layout.qHyperCube.qMeasureInfo[measureIndex];
                                            /* Don't use jquery here,improves performance */
                                            let cellColor = getCellColor(qDataColumn.qNum,
                                                rpSign,
                                                measure.colorType,
                                                measure.colorReverse,
                                                measure.posColor,
                                                measure.negColor,
                                                measure.colorExp,
                                                measure.isPercentage);
                                            let style = cellColor.length > 0 ? ' style="background-color: ' + cellColor + ';"' : '';
                                            $bodyrow.append('<td' + style + '>' + qDataColumn.qText + '</td>');
                                            // var $bodycell = $(document.createElement('td'));
                                            // $bodycell.text(qDataColumn.qText);
                                            // $bodycell.css('background-color',getCellColor(columnIndex,qDataColumn.qNum,rpSign,layout.qHyperCube.qMeasureInfo[measureIndex].isPercentage));
                                            // $bodyrow.append($bodycell);
                                        }
                                    });

                                    /* Add row to table */
                                    if (rowStates[rpDim]['visibile'] == false) {
                                        $bodyrow.hide();
                                    }
                                    $body.append($bodyrow);

                                    /* Check to see if an additional row is needed for percentage */
                                    if (percentageLineDims.includes(rpDimTxt)) {
                                        var $bodyrow = $(document.createElement('tr'));
                                        $bodyrow.addClass('inda_pandl_percentage_row_' + id);

                                        /* First column */
                                        var $bodycell = $(document.createElement('td'));

                                        /* Add toggler empty in this case*/
                                        var $togglerDiv = $(document.createElement('div'));
                                        $togglerDiv.addClass('inda_pandl_row_toggler_cont');
                                        $togglerDiv.css('width', 15 * rpLevel);
                                        $bodycell.append($togglerDiv)

                                        /* Dim */
                                        var $bodycellDiv = $(document.createElement('div'));
                                        $bodycellDiv.text(rpDimTxt + ' %');
                                        $bodycell.append($bodycellDiv);

                                        $bodyrow.append($bodycell);

                                        /* Actual Data*/
                                        let calculateRows = []

                                        qDataRow.forEach(function (qDataColumn, columnIndex, qDataRow) {
                                            if (!columnsToHide.includes(columnIndex)) {
                                                var $bodycell = $(document.createElement('td'));

                                                let value;
                                                //console.log('index: ' + index);
                                                //console.log('length: ' + layout.qHyperCube.qMeasureInfo.length)
                                                let measureIndex = columnIndex % layout.qHyperCube.qMeasureInfo.length;
                                                let measure = layout.qHyperCube.qMeasureInfo[measureIndex];
                                                //console.log('measureIndex: ' + measureIndex);

                                                //console.log('percentageCalcOption: ' + layout.qHyperCube.qMeasureInfo[measureIndex].percentageCalcOption);

                                                if (measure.percentageCalcOption == 'divide') {
                                                    // console.log('Action: divide');
                                                    // console.log('qDataColumn.qNum: ' + qDataColumn.qNum);
                                                    // console.log('qData[0][columnIndex].qNum: ' + qData[0][columnIndex].qNum);
                                                    if (qData[0][columnIndex].qNum !== 0) {
                                                        value = qDataColumn.qNum / qData[percentageLineBaseIndex][columnIndex].qNum
                                                    } else {
                                                        value = undefined;
                                                    }
                                                    calculateRows[columnIndex] = value
                                                } else if (measure.percentageCalcOption == 'substract') {
                                                    // console.log('Action: substract');
                                                    // console.log('calculateRows[columnIndex -1]: ' + calculateRows[columnIndex -1]);
                                                    // console.log('calculateRows[columnIndex -2]: ' + calculateRows[columnIndex -2]);                                    
                                                    value = calculateRows[columnIndex - 2] - calculateRows[columnIndex - 1];
                                                    calculateRows[columnIndex] = value
                                                } else if (measure.percentageCalcOption == 'do not calculate') {
                                                    value = undefined;
                                                }
                                                $bodycell.text(value ? percentageFormat.format(value) : '');
                                                $bodycell.css('background-color', getCellColor(value,
                                                    rpSign,
                                                    measure.colorType,
                                                    measure.colorReverse,
                                                    measure.posColor,
                                                    measure.negColor,
                                                    measure.colorExp,
                                                    measure.isPercentage));
                                                $bodyrow.append($bodycell);
                                            }
                                        });

                                        /* Add row to table */
                                        $body.append($bodyrow);
                                    }
                                }
                            });

                            var $bodyrow = $(document.createElement('tr'));
                            var $bodycell = $(document.createElement('td'));

                            $table.append($body);

                            $element.empty().append($table);



                            //console.log(state);

                            function toggleRow(dim, action) {
                                let toggleElement = $('#' + id + ' tr[inda_pandl_dim="' + dim + '"] i.inda_pandl_row_toggler');
                                if (action === 'collapse') {
                                    toggleElement.switchClass('lui-icon--minus', 'lui-icon--plus');
                                    rowStates[dim]['expanded'] = false;
                                } else {
                                    toggleElement.switchClass('lui-icon--plus', 'lui-icon--minus');
                                    rowStates[dim]['expanded'] = true;
                                }
                                hideShowChildRows(dim, action);
                            }

                            function hideShowChildRows(dim, action) {
                                let rows = $('#' + id + ' tr[inda_pandl_parent="' + dim + '"]');
                                if (rows.length > 0) {
                                    rows.each(function (index) {
                                        let childDim = $(this).attr('inda_pandl_dim');
                                        if (action == 'collapse' || rowStates[childDim]['expanded'] == true) {
                                            hideShowChildRows(childDim, action);
                                        }
                                        if (action == 'collapse') {
                                            rowStates[childDim]['visibile'] = false;
                                            $(this).hide();
                                        } else {
                                            rowStates[childDim]['visibile'] = true;
                                            $(this).show();
                                        }

                                    });
                                }
                            }

                            function selectFieldAndParentChain($element) {
                                let selectField = qlik.currApp(this).field($element.attr('inda_pandl_dim_field'));
                                //console.log(selectField);
                                //console.log('Selecting: ' + $(this).text());
                                selectField.selectValues([$element.text()]).then(
                                    function () {
                                        //console.log('Selected')
                                    },
                                    function () {
                                        //console.log('Refused')
                                    },
                                );

                                /* Selecting parent */
                                let parentId = $element.closest("tr").attr("inda_pandl_parent");
                                //console.log('Parent id: ' + parentId);

                                if (parentId) {
                                    var parentElement = $("tr[inda_pandl_dim='" + parentId + "']").find(".inda_pandl_row_selectable"); // Find the target div inside the matching tr
                                    //console.log(parentElement.text()); // Do something with the selected element
                                    selectFieldAndParentChain(parentElement);
                                } else {
                                    //console.log('No parent');
                                }

                            }

                            /* Add actions when document is loaded */
                            $(document).ready(function () {
                                /* add click for export */
                                $('#' + id + ' .inda_pandl_download').click(function (e) {
                                    console.log('Downloading');
                                    qlik.currApp(this).visualization.get(layout.qInfo.qId).then(function (vis) {
                                        vis.exportData({ format: 'OOXML', state: 'A' }).then(function (link) {
                                            window.open(link)
                                        })
                                    })
                                });

                                /* add click for row toggler */
                                $('#' + id + ' .inda_pandl_row_toggler').click(function (e) {
                                    //console.log('Clicked row toggler: ' + $(this).attr('inda_pandl_dim'));                    
                                    let action = '';
                                    if ($(this).hasClass('lui-icon--minus')) {
                                        action = 'collapse';
                                    } else {
                                        action = 'expand';
                                    }
                                    toggleRow($(this).attr('inda_pandl_dim'), action);
                                });

                                // Add click functions to make row selections
                                $('#' + id + ' .inda_pandl_row_selectable').click(function (e) {
                                    //console.log('Clicked selections: ' + $(this).attr('inda_pandl_dim_field'));                    
                                    selectFieldAndParentChain($(this));
                                })

                                // Add click functions to make header selections
                                $('#' + id + ' .inda_pandl_head_selectable').click(function (e) {
                                    let dim = parseInt($(this).attr('inda_pandl_dim_no'));
                                    let elem = parseInt($(this).attr('inda_pandl_elem_no'));
                                    backendApi.selectValues(dim, [elem], true).then(
                                        function (value) {
                                            //console.log('Selected')
                                        },
                                        function (value) {
                                            //console.log(value);
                                            //console.log('Refused')
                                        },
                                    )
                                        ;
                                })
                            });
                            return qlik.Promise.resolve();
                        }
                        catch (err) {
                            console.log("Error caught in InsightData Profit and Loss:", err.message);
                            console.log(err.stack);
                            throw (err);
                        }
                    });

            }
        };
    });