import { useState, useEffect, useMemo } from "react";
import { BarChart, BarList, Card } from "@tremor/react";
import excelFormula from "excel-formula";

const groupByCampusId = (records) => {
    return records.reduce((acc, record) => {
        const campusId = record.campus_id;
        if (!acc[campusId]) {
            acc[campusId] = [];
        }
        acc[campusId].push(record);
        return acc;
    }, {});
};

// Function to append records to campuses
const appendRecordsToCampuses = (campuses, records, formulas) => {
    const groupedRecords = groupByCampusId(records);

    return campuses.map((campus) => {
        // Retrieve the records for the current campus
        const campusRecords = groupedRecords[campus.campus_id] || [];

        // Append records as a new "items" array
        return {
            ...campus,
            items: campusRecords,
            formulas: formulas,
        };
    });
};

const replaceFormulasWithValues = (data) => {
    return data.map((campus) => {
        const subIdValueMap = {};
        campus.items.forEach((item) => {
            subIdValueMap[item.sub_id] = item.value;
        });
        let total_scores = 0;
        const updatedFormulas = campus.formulas.map((formula) => {
            let formulaStr = formula.formula;

            // Find and replace sub_ids (A1, B1, etc.)
            formulaStr = formulaStr.replace(/([A-Z]\d+)/g, (match) => {
                // if no match make it 0
                // return subIdValueMap[match] || match; // Replace with value or keep sub_id if no value
                return subIdValueMap[match] || 0;
            });

            let score = eval(excelFormula.toJavaScript(formulaStr));
            total_scores += score;

            return {
                ...formula,
                formula: formulaStr, // Update the formula with replaced values
                score: score,
            };
        });

        return {
            ...campus,
            formulas: updatedFormulas, // Update formulas in the campus object
            total_scores: total_scores,
        };
    });
};

const CampusSDGScoreChart = ({ topCampus, selectedYear }) => {
    const [topCampuses, setTopCampuses] = useState([]);
    const [sdgs, setSdgs] = useState([
        { sdg_id: "SDG01", no: 1, title: "No Poverty", color: "#E5243B" },
        { sdg_id: "SDG02", no: 2, title: "Zero Hunger", color: "#DDA63A" },
        {
            sdg_id: "SDG03",
            no: 3,
            title: "Good Health and Well-being",
            color: "#4C9F38",
        },
        {
            sdg_id: "SDG04",
            no: 4,
            title: "Quality Education",
            color: "#C5192D",
        },
        { sdg_id: "SDG05", no: 5, title: "Gender Equality", color: "#FF3A21" },
        {
            sdg_id: "SDG06",
            no: 6,
            title: "Clean Water and Sanitation",
            color: "#26BDE2",
        },
        {
            sdg_id: "SDG07",
            no: 7,
            title: "Affordable and Clean Energy",
            color: "#FCC30B",
        },
        {
            sdg_id: "SDG08",
            no: 8,
            title: "Decent Work and Economic Growth",
            color: "#A21942",
        },
        {
            sdg_id: "SDG09",
            no: 9,
            title: "Industry, Innovation, and Infrastructure",
            color: "#FD6925",
        },
        {
            sdg_id: "SDG10",
            no: 10,
            title: "Reduced Inequality",
            color: "#DD1367",
        },
        {
            sdg_id: "SDG11",
            no: 11,
            title: "Sustainable Cities and Communities",
            color: "#FD9D24",
        },
        {
            sdg_id: "SDG12",
            no: 12,
            title: "Responsible Consumption and Production",
            color: "#BF8B2E",
        },
        { sdg_id: "SDG13", no: 13, title: "Climate Action", color: "#3F7E44" },
        {
            sdg_id: "SDG14",
            no: 14,
            title: "Life Below Water",
            color: "#0A97D9",
        },
        { sdg_id: "SDG15", no: 15, title: "Life on Land", color: "#56C02B" },
        {
            sdg_id: "SDG16",
            no: 16,
            title: "Peace, Justice, and Strong Institutions",
            color: "#00689D",
        },
        {
            sdg_id: "SDG17",
            no: 17,
            title: "Partnerships for the Goals",
            color: "#19486A",
        },
    ]);
    const [selectedSdg, setSelectedSdg] = useState("SDG01");
    const [formulas, setFormulas] = useState([]);
    const [records, setRecords] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [recordScores, setRecordScores] = useState([]);

    useEffect(() => {
        const fetchCampuses = async () => {
            const response = await fetch(
                "https://ai-backend-drcx.onrender.com/api/get/campuses"
            );
            const data = await response.json();
            setCampuses(data);
        };
        const fetchRecords = async () => {
            try {
                const response = await fetch(
                    `https://ai-backend-drcx.onrender.com/api/get/records-values-by-sdg_id/${selectedSdg}/${selectedYear}`
                );
                const data = await response.json();
                const uniqueSectionIds = [
                    ...new Set(data.map((item) => item.section_id)),
                ];
                try {
                    let temp_formula = [];
                    for (const section_id of uniqueSectionIds) {
                        const response = await fetch(
                            `https://ai-backend-drcx.onrender.com/api/get/formula/${section_id}`
                        );
                        const formula = await response.json();
                        temp_formula.push(formula[0]);
                    }
                    setFormulas(temp_formula);
                } catch (error) {
                    console.error("Error fetching formulas:", error);
                }
                setRecords(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchCampuses();
        fetchRecords();
    }, [selectedSdg, selectedYear]);

    useEffect(() => {
        if (formulas.length > 0 && records.length > 0 && campuses.length > 0) {
            const uniqueFormulaIds = [...new Set(formulas.map((item) => item))];
            // console.log(uniqueFormulaIds);

            const processedData = replaceFormulasWithValues(
                appendRecordsToCampuses(campuses, records, uniqueFormulaIds)
            );
            setRecordScores(processedData);
            // setScores(processedData);
            // console.log(
            //     "Processed data after replacing formulas with values:",
            //     processedData
            // );
            const top4Campuses = processedData
                .sort((a, b) => b.total_scores - a.total_scores)
                .slice(0, 5);
            // console.log(
            //     "Top 4 campuses after sorting and slicing:",
            //     top4Campuses
            // );
            console.log(top4Campuses, "hahahaha");
            setTopCampuses(top4Campuses);
        }
    }, [formulas, records, campuses, selectedSdg]);

    return (
        <>
            <Card className="w-[30%]">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Select SDG
                    </label>
                    <select
                        className="input input-bordered w-full max-w-xs"
                        value={selectedSdg}
                        onChange={(e) => setSelectedSdg(e.target.value)}
                    >
                        {sdgs.map((sdg) => (
                            <option key={sdg.sdg_id} value={sdg.sdg_id}>
                                {`${sdg.no}. ${sdg.title}`}
                            </option>
                        ))}
                    </select>
                </div>
                {topCampuses && topCampuses.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between border-b border-tremor-border p-6 dark:border-dark-tremor-border">
                            <p className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                                Top 5 Campuses
                            </p>
                            <p className="text-tremor-label font-medium uppercase text-tremor-content dark:text-dark-tremor-content">
                                Score
                            </p>
                        </div>

                        <BarList
                            data={
                                topCampuses.map((campus) => ({
                                    name: campus.name
                                        .replace("Campus", "")
                                        .replace("BatStateU - ", ""),
                                    value: campus.total_scores,
                                }))
                                // .sort((a, b) => b.value - a.value)
                                // .slice(0, 4)
                            }
                        />
                    </>
                ) : (
                    <p>Loading data...</p>
                )}
            </Card>
        </>
    );
};

export default CampusSDGScoreChart;
