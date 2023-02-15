import React from "react";
import "./App.css";

import CssBaseline from "@material-ui/core/CssBaseline";
import MaUTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import {
  useTable,
  useAsyncDebounce,
  useFilters,
  useGlobalFilter,
} from "react-table";
import { useCSVReader } from "react-papaparse";
import { CSVLink } from "react-csv";

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <span>
      Search:{" "}
      <input
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
        style={{
          fontSize: "1.1rem",
          border: "0",
        }}
      />
    </span>
  );
}

function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
    />
  );
}

function Table({ columns, data }) {
  const [downloadData, setDownloadData] = React.useState([]);

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    getTableBodyProps,
    state,
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
    },
    useFilters,
    useGlobalFilter
  );

  React.useEffect(() => {
    setDownloadData(rows.map((row) => row?.original));
  }, [rows]);

  // Render the UI for your table
  return (
    <>
      <CSVLink data={downloadData}>Download me</CSVLink>
      <MaUTable {...getTableProps()}>
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TableCell {...column.getHeaderProps()}>
                  {column.render("Header")}
                  <div>{column.canFilter ? column.render("Filter") : null}</div>
                </TableCell>
              ))}
            </TableRow>
          ))}
          <tr>
            <th
              colSpan={visibleColumns?.length}
              style={{
                textAlign: "left",
              }}
            >
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </th>
          </tr>
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <TableCell {...cell.getCellProps()}>
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </MaUTable>
    </>
  );
}

function App() {
  const { CSVReader } = useCSVReader();

  const [tableData, setTableData] = React.useState([]);
  const [header, setHeader] = React.useState([]);

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "40px auto" }}>
      <CssBaseline />
      <CSVReader
        onUploadAccepted={(results) => {
          const notFirstData = results.data.filter((_, i) => i !== 0);

          const header = results.data[0].map((item) => ({
            Header: item,
            accessor: item,
          }));

          const tempData = notFirstData.map((data) => {
            const categoryPosts = data.reduce((acc, post, i) => {
              return { ...acc, [header[i].Header]: post };
            }, {});

            return categoryPosts;
          });

          setTableData(tempData);
          setHeader(header);
        }}
      >
        {({ getRootProps }) => (
          <div style={{ position: "relative" }}>
            <div className="btn-container">
              <button type="button" {...getRootProps()} className="button">
                Browse file
              </button>
            </div>
            <span
              style={{
                background: "#000",
                height: "2px",
                width: "100%",
                display: "block",
                marginTop: "20px",
              }}
            />
          </div>
        )}
      </CSVReader>

      {tableData.length ? <Table columns={header} data={tableData} /> : null}
    </div>
  );
}

export default App;
