// iconMapping.ts
import { SvgIconComponent } from '@mui/icons-material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import NotesIcon from '@mui/icons-material/Notes';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import TabIcon from '@mui/icons-material/Tab';
import TabUnselectedIcon from '@mui/icons-material/TabUnselected';
import WorkspacesIcon from '@mui/icons-material/Workspaces';

const iconMapping: { [key: string]: SvgIconComponent } = {
    text: TextFieldsIcon,
    checkbox: CheckBoxIcon,
    radio: RadioButtonCheckedIcon,
    select: ArrowCircleDownIcon,
    combobox: ArrowCircleDownIcon,
    combobox_small: ArrowCircleDownIcon,
    memo: NotesIcon,
    number: LooksOneIcon,
    sub_form: DynamicFormIcon,
    tabs: TabIcon,
    tab_item: TabUnselectedIcon,
    group: WorkspacesIcon,
    other: SelectAllIcon,
};

export default iconMapping;