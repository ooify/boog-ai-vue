<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="名称" prop="promptName">
        <el-input v-model="queryParams.promptName" placeholder="请输入提示词名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="模型" prop="modelId">
        <el-select v-model="queryParams.modelId" placeholder="请选择模型">
          <el-option v-for="dict in modelList" :key="dict.modelId" :label="dict.modelName"
            :value="dict.modelId"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="tag">
        <el-select v-model="queryParams.tag" placeholder="请选择提示词类型" clearable>
          <el-option v-for="dict in boog_ai_prompt_tag" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option v-for="dict in boog_ai_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="默认" prop="isDefault">
        <el-select v-model="queryParams.isDefault" placeholder="请选择默认" clearable>
          <el-option v-for="dict in boog_ai_default" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
        <el-date-picker v-model="daterangeCreateTime" value-format="YYYY-MM-DD" type="daterange" range-separator="-"
          start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['server:prompt:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['server:prompt:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['server:prompt:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['server:prompt:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="promptList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="提示词id" align="center" prop="promptId" width="80" />
      <el-table-column label="提示词名称" align="center" prop="promptName"width="150" />
      <el-table-column label="提示词内容" align="center" prop="promptText"width="200" show-overflow-tooltip />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="模型id" align="center" prop="modelId" width="80" />
      <el-table-column label="类型" align="center" prop="tag" width="80">
        <template #default="scope">
          <dict-tag :options="boog_ai_prompt_tag" :value="scope.row.tag" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="boog_ai_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="默认" align="center" prop="isDefault">
        <template #default="scope">
          <dict-tag :options="boog_ai_default" :value="scope.row.isDefault" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="130">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="130">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['server:prompt:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['server:prompt:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改提示词对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="promptRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="promptName">
          <el-input v-model="form.promptName" placeholder="请输入提示词名称" />
        </el-form-item>
        <el-form-item label="内容" prop="promptText">
           <el-input v-model="form.promptText" type="textarea" placeholder="请输入内容" :autosize="{ minRows: 10, maxRows: 20 }"/>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="模型" prop="modelId">
              <el-select v-model="form.modelId" placeholder="请选择模型">
                <el-option v-for="dict in modelList" :key="dict.modelId" :label="dict.modelName"
                  :value="dict.modelId"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="tag">
              <el-select v-model="form.tag" placeholder="请选择提示词类型">
                <el-option v-for="dict in boog_ai_prompt_tag" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch v-model="form.status" active-value="1" inactive-value="0" active-text="启用"
                inactive-text="禁用"></el-switch>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="设为默认" prop="isDefault">
              <el-switch v-model="form.isDefault" active-value="1" inactive-value="0" active-text="是" inactive-text="否"
                :disabled="form.status === '0'"></el-switch>
              <div v-if="form.status === '0' && form.isDefault === '1'" class="el-form-item__error">
                禁用状态下不能设为默认模型
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Prompt">
import { listPrompt, getPrompt, delPrompt, addPrompt, updatePrompt } from "@/api/server/prompt";
import { listModel } from "@/api/server/model";
const { proxy } = getCurrentInstance();
const { boog_ai_prompt_tag, boog_ai_default, boog_ai_status } = proxy.useDict('boog_ai_prompt_tag', 'boog_ai_default', 'boog_ai_status');

const promptList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeCreateTime = ref([]);
const daterangeUpdateTime = ref([]);


const modelList = ref([])

const getModelList = () => {
  listModel({}).then(res => {
    modelList.value = res.rows
  });
}
getModelList();

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    promptName: null,
    modelId: null,
    tag: null,
    status: null,
    isDefault: null,
    createTime: null,
  },
  rules: {
    promptName: [
      { required: true, message: "提示词名称不能为空", trigger: "blur" }
    ],
    promptText: [
      { required: true, message: "提示词内容不能为空", trigger: "blur" }
    ],
    modelId: [
      { required: true, message: "模型id不能为空", trigger: "blur" }
    ],
    tag: [
      { required: true, message: "提示词类型不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询提示词列表 */
function getList() {
  loading.value = true;
  queryParams.value.params = {};
  if (null != daterangeCreateTime && '' != daterangeCreateTime) {
    queryParams.value.params["beginCreateTime"] = daterangeCreateTime.value[0];
    queryParams.value.params["endCreateTime"] = daterangeCreateTime.value[1];
  }
  if (null != daterangeUpdateTime && '' != daterangeUpdateTime) {
    queryParams.value.params["beginUpdateTime"] = daterangeUpdateTime.value[0];
    queryParams.value.params["endUpdateTime"] = daterangeUpdateTime.value[1];
  }
  listPrompt(queryParams.value).then(response => {
    promptList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    promptId: null,
    promptName: null,
    promptText: null,
    description: null,
    modelId: null,
    tag: null,
    status: null,
    isDefault: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("promptRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeCreateTime.value = [];
  daterangeUpdateTime.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.promptId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加提示词";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _promptId = row.promptId || ids.value
  getPrompt(_promptId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改提示词";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["promptRef"].validate(valid => {
    if (valid) {
      if (form.value.promptId != null) {
        updatePrompt(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPrompt(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _promptIds = row.promptId || ids.value;
  proxy.$modal.confirm('是否确认删除提示词编号为"' + _promptIds + '"的数据项？').then(function () {
    return delPrompt(_promptIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('server/prompt/export', {
    ...queryParams.value
  }, `prompt_${new Date().getTime()}.xlsx`)
}

getList();
</script>
