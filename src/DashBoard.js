import {
  Card,
  Table,
  Button,
  Cascader,
  Input,
  Space,
  Typography,
  Tabs,
  Flex,
  MenuProps,
  Dropdown,
  Select,
} from "antd";

import {
  MinusCircleOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import React, { useEffect, useState } from "react";
import axios from "axios";

const { TextArea } = Input;
const { Title } = Typography;

function DashBoard() {
  const [conditions, setConditions] = useState([{ field: null, str: "" }]); //전체 검색 조건 state
  const [currentFields, setcurrentFields] = useState([]); //현재 선택된 로그의 필드들
  const [searchedData, setsearchedData] = useState([]); //표데이터
  const [columns, setcolumns] = useState([]); //이거도 필드들 서로 약간 다른데 구분 필요
  const [logSettingOptions, setLogSettingOptions] = useState(null); //처음에 가져오는 로그 트리 구조

  const handleAddCondition = () => {
    setConditions([...conditions, { field: null, str: "" }]);
    console.log(conditions);
  };

  const handleRemoveCondition = (index) => {
    const newConditions = conditions.filter((_, idx) => idx !== index);
    setConditions(newConditions);
  };

  const changeConditionField = (value, index) => {
    const temp = conditions.map((condition) => {
      if (condition.id === index) {
        return { ...condition, field: value };
      }
      return condition;
    });

    setConditions(temp);
  };

  const changeConditionStr = (value, index) => {
    console.log("test");
    console.log("value" + value);
    const temp = conditions.map((condition) => {
      if (condition.id === index) {
        return { ...condition, str: value };
      }
      return condition;
    });

    setConditions(temp);
    console.log(conditions);
  };

  //어플 실행시 설정 데이터를 가져온다
  useEffect(() => {
    console.log("hello");
    axios
      .get("/settings_index/_doc/log_system")
      .then((response) => {
        console.log(response.data);
        setLogSettingOptions(response.data["_source"]["log_system"]);
      })
      .catch((error) => {
        setLogSettingOptions([]);
      });
  }, []);

  const searchElasticsearch = async () => {
    let body = {
      query: {
        bool: {
          must: [],
        },
      },
    };
    body.query.bool.must.push({ match: { message: "Mozilla" } });
    body._source = [
      "timestamp",
      "url_original",
      "http_request_method",
      "http_request_referrer",
      "user_agent_original",
    ];
    body.size = 100;
    console.log(body);

    try {
      const response = await axios({
        method: "post",
        url: "filebeat-8.10.4-2023.11.15/_search",
        data: body,
      });

      const transformSourceToList = (responseData) => {
        try {
          console.log("responseData:", responseData);
          const sourceList = responseData.hits.hits.map((hit) => ({
            key: hit._id, // 각 항목의 _id를 list key로 사용
            ...hit._source,
          }));
          console.log("sourceList:", sourceList);
          return sourceList;
        } catch (error) {
          console.error("Error in transformSourceToList:", error);
        }
      };

      // 결과 확인
      const sourceList = transformSourceToList(response.data);
      console.log(sourceList);

      setsearchedData(sourceList);
    } catch (error) {
      console.error("Error during Elasticsearch query:", error);
    }
  };

  return (
    <div>
      <Title level={5}>LOG SEARCH</Title>
      <Card
        style={{
          width: "match-parent",
          backgroundColor: "#f0f0f0",
        }}
        bodyStyle={{ padding: "5px" }}
      >
        <Cascader
          options={logSettingOptions}
          onChange={function (value) {
            if (value !== undefined) {
              console.log(value);
              console.log(value.join("/"));
              setcurrentFields([
                { value: "timestamp", label: "timestamp" },
                { value: "url_original", label: "url_original" },
                {
                  value: "http_request_method",
                  label: "http_request_method",
                },
                {
                  value: "http_request_referrer",
                  label: "http_request_referrer",
                },
                {
                  value: "user_agent_original",
                  label: "user_agent_original",
                },
              ]);
              setcolumns([
                { title: "time", dataIndex: "timestamp" },
                { title: "url", dataIndex: "url_original" },
                {
                  title: "http method",
                  dataIndex: "http_request_method",
                },
                {
                  title: "ref",
                  dataIndex: "http_request_referrer",
                },
                {
                  title: "user agent",
                  dataIndex: "user_agent_original",
                },
              ]);
            } else {
              setcurrentFields([]);
              setcolumns([]);
            }
          }}
          placeholder="Please select"
        />
        <Button onClick={handleAddCondition} icon={<PlusCircleOutlined />}>
          조건 추가
        </Button>

        <Button
          icon={<SearchOutlined />}
          style={{ float: "right" }}
          type="primary"
          onClick={searchElasticsearch}
        >
          검색
        </Button>

        <div>
          {conditions.map((condition, index) => (
            <div key={index}>
              <Flex>
                <Select
                  defaultValue="select field"
                  style={{
                    width: 120,
                  }}
                  onChange={(value) => {
                    changeConditionField(value, index);
                  }}
                  options={currentFields}
                />

                <Input
                  type="text"
                  onChange={(e) => {
                    changeConditionStr(e.target.value, index);
                  }}
                />

                <Button
                  onClick={() => handleRemoveCondition(index)}
                  icon={<MinusCircleOutlined />}
                >
                  조건 삭제
                </Button>
              </Flex>
            </div>
          ))}
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={searchedData} //{data}
        pagination={false}
        tableLayout={"auto"}
        scroll={{
          x: 0,
          y: 1000,
        }}
        size="small"
      />
      <Card
        style={{
          width: "match-parent",
          backgroundColor: "#f0f0f0",
        }}
        bodyStyle={{ padding: "5px" }}
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              label: "export txt",
              key: "1",
              children: (
                <>
                  <TextArea rows={2} />
                  <Button>export txt</Button>
                </>
              ),
            },
            {
              label: "export csv",
              key: "2",
              children: (
                <>
                  <Button>export csv</Button>
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default DashBoard;
