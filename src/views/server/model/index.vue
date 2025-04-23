<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模型名称" prop="modelName">
        <el-input v-model="queryParams.modelName" placeholder="请输入模型名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="提供方" prop="provider">
        <el-input v-model="queryParams.provider" placeholder="请输入提供方" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType">
        <el-select v-model="queryParams.modelType" placeholder="请选择模型类型" clearable>
          <el-option v-for="dict in boog_ai_model_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型特点" prop="tag">
        <el-select v-model="queryParams.tag" placeholder="请选择模型特点" clearable>
          <el-option v-for="dict in boog_ai_model_tag" :key="dict.value" :label="dict.label" :value="dict.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['server:model:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['server:model:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['server:model:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['server:model:export']">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain @click="openDrawer = !openDrawer" v-hasPermi="['server:model:ollama']">
          <img src="@/assets/icons/ollama.png" alt="Ollama" width="20" height="20" style="margin-right: 5px;" />
          Ollama管理
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-drawer v-model="openDrawer" title="Ollama管理" :direction="'rtl'">
      <el-form label-position="top">
        {{ ollamaURLConfig }}
        <el-form-item label="URL">
          <el-col :span="19">
            <el-input style="width: auto;" v-model="ollamaURLConfig.configValue" type="text" placeholder="ollama url"
              clearable :style="{ width: '90%' }"></el-input>
          </el-col>
          <el-button size="small" icon="Refresh" circle @click="refreshUrl" />
          <el-button size="small" type="success" plain icon="Select" circle @click="updateUrl" />
        </el-form-item>
        <el-form-item label="Models">
          <el-col :span="8">
            <el-button icon="Refresh" @click="getOllamaModels">获取模型</el-button>
          </el-col>
          <el-col :span="16">
            <el-input clearable v-model="modelTag" placeholder="pull ollama model enter tag">
              <template #append>
                <el-button icon="Download" @click="pullOllamaModel" />
              </template>
            </el-input>
          </el-col>
          <el-progress v-if="showProgress" :percentage="100" status="success" />
          <el-table v-loading="loading" :data="ollamaModels" style="margin-top: 16px">
            <el-table-column label="模型代码" align="center" prop="model" width="150" />
            <el-table-column label="模型名称" align="center" prop="name" width="150" />
            <el-table-column label="模型大小" align="center" prop="size" :formatter="formatModelSize" />
            <el-table-column label="模型规格" align="center" prop="details.parameter_size" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130">
              <template #default="scope">
                <el-button link type="primary" icon="DocumentAdd" @click="handleModelAdd(scope.row)">添加</el-button>
                <el-button link type="primary" icon="Delete" @click="handleModelDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>



    </el-drawer>

    <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模型id" align="center" prop="modelId" width="80" />
      <el-table-column label="模型代码" align="center" prop="modelCode" width="200" />
      <el-table-column label="模型名称" align="center" prop="modelName" width="200" />
      <el-table-column label="模型版本" align="center" prop="modelVersion" width="80" />
      <el-table-column label="提供方" align="center" prop="provider" />
      <el-table-column label="模型类型" align="center" prop="modelType" width="100">
        <template #default="scope">
          <dict-tag :options="boog_ai_model_type" :value="scope.row.modelType" />
        </template>
      </el-table-column>
      <el-table-column label="模型描述" align="center" prop="description" />
      <el-table-column label="调用地址" align="center" prop="apiEndpoint" width="180" />
      <el-table-column label="模型特点" align="center" prop="tag">
        <template #default="scope">
          <dict-tag :options="boog_ai_model_tag" :value="scope.row.tag" />
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
            v-hasPermi="['server:model:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['server:model:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改模型对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <!-- 基本信息部分 -->
          <el-col :span="24">
            <div class="section-title">基本信息</div>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型代码" prop="modelCode">
              <el-input v-model="form.modelCode" placeholder="请输入模型代码" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型名称" prop="modelName">
              <el-input v-model="form.modelName" placeholder="请输入模型名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型版本" prop="modelVersion">
              <el-input v-model="form.modelVersion" placeholder="请输入模型版本" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="提供方" prop="provider">
              <el-input v-model="form.provider" placeholder="请输入提供方" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型类型" prop="modelType">
              <el-select v-model="form.modelType" placeholder="请选择模型类型" style="width: 100%">
                <el-option v-for="dict in boog_ai_model_type" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型特点" prop="tag">
              <el-select v-model="form.tag" placeholder="模型特点" style="width: 100%">
                <el-option v-for="dict in boog_ai_model_tag" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 模型配置部分 -->
          <el-col :span="24">
            <div class="section-title">模型配置</div>
          </el-col>

          <el-col :span="24">
            <el-form-item label="调用地址" prop="apiEndpoint">
              <el-input v-model="form.apiEndpoint" placeholder="请输入API调用地址" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模型描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入模型描述信息" />
            </el-form-item>
          </el-col>

          <!-- 状态设置部分 -->
          <el-col :span="24">
            <div class="section-title">状态设置</div>
          </el-col>

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
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Model">
import { listModel, getModel, delModel, addModel, updateModel } from "@/api/server/model";
import { getConfigKey, listConfig, updateConfig } from "@/api/system/config";
import axios from 'axios';
import { onMounted } from 'vue';
const { proxy } = getCurrentInstance();
const { boog_ai_model_tag, boog_ai_default, boog_ai_status, boog_ai_model_type } = proxy.useDict('boog_ai_model_tag', 'boog_ai_default', 'boog_ai_status', 'boog_ai_model_type');

const modelList = ref([]);
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

const openDrawer = ref(false);

const ollamaURLConfig = ref({});
const ollamaModels = ref([]);

const getConfig = () => {
  listConfig().then(res => {
    ollamaURLConfig.value = res.rows.find(item => item.configKey === 'ollamaUrl');
  });
}

getConfig();

const refreshUrl = () => {
  axios.get(ollamaURLConfig.value.configValue).then(res => {
    if (res.status === 200) {
      proxy.$modal.msgSuccess(res.data);
    } else {
      proxy.$modal.msgError(res.data);
    }
  }).catch(err => {
    proxy.$modal.msgError("请求失败");
  });
}

const updateUrl = () => {
  updateConfig(ollamaURLConfig.value).then(res => {
    if (res.code !== 200) {
      proxy.$modal.msgError(res.msg);
      return;
    }
    proxy.$modal.msgSuccess("修改成功");
    getConfig();
  });
}

const getOllamaModels = () => {
  axios.get(ollamaURLConfig.value.configValue + '/api/tags').then(res => {
    console.log(res.data.models);
    ollamaModels.value = res.data.models;
  }).catch(err => {
    proxy.$modal.msgError("请输入正确的URL");
  });
}

const formatModelSize = (row, column, cellValue) => {
  if (cellValue === null || cellValue === undefined) {
    return '';
  }
  const sizeInBytes = parseInt(cellValue);
  const sizeInGB = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
  return `${sizeInGB} GB`;
};

const handleModelAdd = (model) => {
  const modelCode = model.model;
  const modelName = model.name;
  const modelVersion = model.version;
  const provider = 'ollama';
  const apiEndpoint = ollamaURLConfig.value.configValue;
  form.value = {
    modelCode,
    modelName,
    modelVersion,
    provider,
    apiEndpoint
  };
  open.value = true;
  title.value = "添加模型";
};

const handleModelDelete = (model) => {
  const modelCode = model.model;
  proxy.$modal.confirm('是否确认删除模型编号为"' + modelCode + '"的数据项？').then(function () {
    return delModel(modelCode);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

const modelTag = ref("");
const showProgress = ref(false)
const pullOllamaModel = () => {
  console.log(modelTag.value);
  //   curl http://localhost:11434/api/pull -d '{
  //   "model": "llama3.2"
  // }'
  axios.post(ollamaURLConfig.value.configValue + '/api/pull', {
    model: modelTag.value
  }).then(res => {
    console.log(res);
    if (res.status === 200) {
      proxy.$modal.msgSuccess(res.data);
    } else {
      proxy.$modal.msgError(res.data);
    }
  }).catch(err => {
    proxy.$modal.msgError("请求失败");
  });
}



const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    modelCode: null,
    modelName: null,
    provider: null,
    modelType: null,
    tag: null,
    status: null,
    isDefault: null,
    createTime: null,
  },
  rules: {
    modelCode: [
      { required: true, message: "模型代码不能为空", trigger: "blur" }
    ],
    modelName: [
      { required: true, message: "模型名称不能为空", trigger: "blur" }
    ],
    modelVersion: [
      { required: true, message: "模型版本不能为空", trigger: "blur" }
    ],
    provider: [
      { required: true, message: "提供方不能为空", trigger: "blur" }
    ],
    modelType: [
      { required: true, message: "模型类型不能为空", trigger: "change" }
    ],
    apiEndpoint: [
      { required: true, message: "调用地址不能为空", trigger: "blur" }
    ],
    tag: [
      { required: true, message: "模型特点不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询模型列表 */
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
  listModel(queryParams.value).then(response => {
    modelList.value = response.rows;
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
    modelId: null,
    modelCode: null,
    modelName: null,
    modelVersion: null,
    provider: null,
    modelType: null,
    description: null,
    apiEndpoint: null,
    tag: null,
    status: null,
    isDefault: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("modelRef");
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
  ids.value = selection.map(item => item.modelId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加模型";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _modelId = row.modelId || ids.value
  getModel(_modelId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改模型";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["modelRef"].validate(valid => {
    if (valid) {
      if (form.value.modelId != null) {
        updateModel(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addModel(form.value).then(response => {
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
  const _modelIds = row.modelId || ids.value;
  proxy.$modal.confirm('是否确认删除模型编号为"' + _modelIds + '"的数据项？').then(function () {
    return delModel(_modelIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('server/model/export', {
    ...queryParams.value
  }, `model_${new Date().getTime()}.xlsx`)
}

function mangerOllama() {

}
getList();
</script>
