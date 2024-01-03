import React, {useState} from "react";
import ReactTable from "react-table";
import {makeDebounce} from "../../../tools/inputs";
import ItemFormModal from "./ItemFormModal";
import DeleteItemModal from "./DeleteItemModal";
import ReactTableFullScreen, {goFullScreen} from "../../ReactTableFullScreen";


/**
 * BaseDataTable Component
 *
 * A generic data table component for displaying and managing a list of resources.
 * The component provides CRUD functionalities (Create, Read, Update, Delete) and
 * relies on external services for data fetching and manipulation.
 *
 * Props:
 * @param {object} dataService - Service to fetch and manipulate data.
 * @param {array} columns - Array of column configurations for the ReactTable.
 * @param {func} labellizer - Function to convert a data item to a string label. Used in delete confirmation.
 * @param {component} actionButtons - React component for action buttons to perform CRUD operations.
 * @param {component} createButton - React component for the button that triggers the creation of a new item.
 * @param {showFullScreenButton} - If the full screen button should be displayed.
 * @param {string} oneResourceTypeName - Singular name of the resource for modals and messages (e.g., "user").
 * @param {string} thisResourceTypeName - Indicative form of the resource for delete confirmation (e.g., "this user").
 * @param {component} formContentComponent - React component for the content inside the item form modal.
 * @param {object} reactTableProps - Additional props to pass to the ReactTable component.
 *
 * State:
 * @state {array} data - List of items to be displayed.
 * @state {number} pages - Total number of pages.
 * @state {boolean} loading - If the data is currently being fetched.
 * @state {boolean} showItemModal - If the item form modal should be displayed.
 * @state {boolean} showDeleteModal - If the delete confirmation modal should be displayed.
 * @state {object} item - Current item being viewed/edited in the modal.
 * @state {object} filter - Current filter applied to the data fetching.
 * @state {boolean} wantUpdate - If the item form modal should be in update mode.
 *
 * Usage:
 * @usage
 * <BaseDataTable
 *     urlListData="/api/users/list"
 *     urlRootData="/api/users"
 *     columns={[...]}
 *     labellizer={item => item.name}
 *     actionButtons={MyActionButtons}
 *     createButton={MyCreateButton}
 *     oneResourceTypeName="un utilisateur"
 *     thisResourceTypeName="cet utilisateur"
 *     formContentComponent={MyFormContent}
 * />
 *
 * @note
 *     The `formContentComponent` must have the following props:
 *         - item: the item to edit (if null, it's a create form)
 *         - onSubmit: the function to call when the form is submitted
 *         - onRequestClose: the function to call when the form is closed
 *         - updateTitle: the title to display when editing an item
 *         - createTitle: the title to display when creating an item
 *
 *     The `actionButtons` must have the following props:
 *         - row: the row of the table
 *         - onEdit: the function to call when the edit button is clicked
 *         - onDelete: the function to call when the delete button is clicked
 *
 *     `actionButtons` has a default implementation, `ActionButtons`, that displays the edit and delete buttons.
 *
 *     The createButton must have the following props:
 *         - onCreate: the function to call when the create button is clicked
 *
 *     `createButton` has a default implementation, `CreateButton`, that displays a create button.
 *
 *     The CRUD API must support the following requests:
 *         - GET /urlListData: to get the list of data
 *         - POST /urlListData: to get the list of data with pagination, sorting and filtering
 *         - POST /urlRootData: to create an item
 *         - PUT /urlRootData/:id: to update an item
 *         - DELETE /urlRootData/:id: to delete an item
 */

export default function BaseDataTable({
                                          dataService,
                                          columns,
                                          labellizer,
                                          actionButtons,
                                          createButton,
                                          showFullScreenButton,
                                          oneResourceTypeName,
                                          thisResourceTypeName,
                                          formContentComponent,
                                          ...reactTableProps
                                      }) {
    const debounce = makeDebounce();

    const [state, setState] = useState({
        data: [],
        pages: null,
        loading: true,
        showItemModal: false,
        showDeleteModal: false,
        item: null,
        filter: null,
        wantUpdate: true,
    });

    const ActionButtonsComponent = actionButtons;
    const CreateButtonComponent = createButton;

    const allowEdit = !!formContentComponent;
    const tableName = "table-" + oneResourceTypeName;

    let reactTableColumns = [...columns];
    if (actionButtons) {
        reactTableColumns.push(
            {

                id: "actions",
                Header: "Actions",
                Cell: props => (
                    // console.log("props", props)),
                    <ActionButtonsComponent
                        item={props.original}
                        onEdit={() => showItemFormModal(true, props.original)}
                        onDelete={showDeleteItemModal}
                    />),
                sortable: false,
                filterable: false,
                width: 150
            });
    }

    /*
    =========================================
    =========================================
    */

    function fetchData(filter) {
        setState(prevState => ({...prevState, loading: true, filter: filter}));
        debounce(() => {
            dataService.listData(filter)
                .then(res => {
                    // console.log("Data fetched:", res)
                    setState(prevState => ({
                        ...prevState,
                        data: res.data,
                        pages: res.pages,
                        loading: false,
                        errorMessage: null
                    }));
                })
                .catch(errors => {
                    console.error("Errors fetching data:", errors);
                    setState(prevState => ({
                        ...prevState,
                        loading: false,
                        errorMessage: "Une erreur est survenue lors du chargement des données."
                    }));
                });
        }, 400);
    }

    function showItemFormModal(wantUpdate, item) {
        if (!allowEdit)
            return;

        setState(prevState => ({
            ...prevState,
            showItemModal: true,
            wantUpdate,
            item
        }));
    }

    function closeItemFormModal() {
        setState(prevState => ({...prevState, showItemModal: false}));
    }

    function showDeleteItemModal(item) {
        setState(prevState => ({...prevState, showDeleteModal: true, item}));
    }

    function closeDeleteItemModal() {
        setState(prevState => ({...prevState, showDeleteModal: false}));
    }


    /*
    =========================================
    =========== CRUD actions ================
    =========================================
    */

    function createItem(item) {
        return dataService.createData(item)
            .then(() => {
                closeItemFormModal();
                fetchData(state.filter);
            })
    }

    function updateItem(item) {
        const index = state.data.findIndex(i => i.id === item.id)

        if (index >= 0) {
            return dataService.updateData(item)
                .then(res => { //fetchData sous condition
                    setState(prevState => ({
                        ...prevState,
                        data: [...prevState.data.slice(0, index), item, ...prevState.data.slice(index + 1)],
                    }));

                    closeItemFormModal();
                })

        } else {
            console.error("L'item n'a pas été trouvé dans la liste des items.")
            return Promise.reject(["L'item n'a pas été trouvé dans la liste des items."])
        }
    }

    function deleteItem(item) {
        const index = state.data.indexOf(item);

        return dataService.deleteData(item)
            .then(res => {
                setState(prevState => ({
                    ...prevState,
                    data: [...prevState.data.slice(0, index), ...prevState.data.slice(index + 1)],
                }));
                closeDeleteItemModal();
            })
    }

    return (
        <div>
            <div className="row">
                <div className="col">
                    {showFullScreenButton &&
                        <button data-tippy-content="Mettre le tableau en plein écran"
                                className="btn btn-primary"
                                onClick={() => goFullScreen(tableName)}>
                            <i className="fas fa-expand-arrows-alt"></i>
                        </button>
                    }
                    {createButton &&
                        <CreateButtonComponent onCreate={() => showItemFormModal(false, null)}/>
                    }
                </div>
            </div>


            <div className="row">
                <div className="col"> {/* vérifier si col*/}
                    <ReactTableFullScreen
                        tableName={tableName}
                        data={state.data}
                        manual
                        pages={state.pages}
                        loading={state.loading}
                        onFetchData={fetchData}
                        columns={reactTableColumns}
                        filterable
                        defaultFilterMethod={(filter, row) => {
                            if (row[filter.id] != null) {
                                return row[filter.id]
                                    .toLowerCase()
                                    .startsWith(filter.value.toLowerCase());
                            }
                        }}
                        resizable={false}
                        previousText="Précédent"
                        nextText="Suivant"
                        loadingText="Chargement..."
                        noDataText={state.errorMessage || "Aucune donnée"}
                        pageText="Page"
                        ofText="sur"
                        rowsText="résultats"
                        minRows={1}
                        {...reactTableProps}
                    />
                </div>

                {allowEdit &&
                    <ItemFormModal
                        item={state.item}
                        component={formContentComponent}
                        isOpen={state.showItemModal}
                        updateTitle={`Mettre à jour ${oneResourceTypeName}`}
                        createTitle={`Créer ${oneResourceTypeName}`}
                        onRequestClose={closeItemFormModal}
                        onSubmit={item => (state.wantUpdate ? updateItem(item) : createItem(item))}
                    />}

                <DeleteItemModal
                    item={state.item}
                    isOpen={state.showDeleteModal}
                    onRequestClose={closeDeleteItemModal}
                    title={`Supprimer ${oneResourceTypeName}`}
                    question={`Voulez-vous vraiment supprimer ${thisResourceTypeName || "cet élément"} : ${state.item && labellizer ? labellizer(state.item) : ""} ?`}
                    onDelete={() => deleteItem(state.item)}
                />
            </div>
        </div>
    );
}
