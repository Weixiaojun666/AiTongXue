<?php

namespace app\controller;

use think\captcha\facade\Captcha;
use think\facade\Db;
use think\facade\Session;

class Api
{
    public function login()
    {
        //TYPE 0未登录 1学生 2教师 3管理员
        $data = input('post.');
//        if (!captcha_check($data['captcha'])) {
//            return( returnJson(1, '验证码错误'));
//        }
        $type = 1;
        $user = Db::table('tb_user_student')->where(['username' => $data['username'], 'state' => 1])->find();
        if (!$user) {
            $user = Db::table('tb_user')->where(['username' => $data['username'], 'state' => 1])->find();
            if ($user) {
                $type = $user['type'];
            }
        }
        if (!$user) {
            return (returnJson(1, msg: "用户不存在"));
        }
        if ($user['password'] != hash("sha256", $data['password'])) {
            return (returnJson(1, msg: "密码错误"));
        }
        if ($user['state'] != 1) {
            return (returnJson(1, msg: "用户已被禁用"));
        }
        $user = ["uid" => $user["id"], "username" => $user["username"], "type" => $type];
        Session('user', $user);
        return (returnJson(msg: "登陆成功"));

    }

    public function logout()
    {
        Session::delete('user');
        return (returnJson(msg: "登出成功"));
    }

    //修改密码
    public function changePassword()
    {
        $user = checkLogin();
        $data = input('post.');
        $oldPassword = $data['oldPassword'];
        $newPassword = $data['newPassword'];
        $result = Db::table('tb_user')->where('id', $user['uid'])->find();
        if ($result['password'] != hash("sha256", $oldPassword)) {
            return (returnJson(1, msg: "原密码错误"));
        }
        $res = Db::table('tb_user')->where('id', $user['uid'])->update(['password' => hash("sha256", $newPassword)]);
        if ($res) {
            return (returnJson(msg: "修改成功"));
        } else {
            return (returnJson(1, msg: "修改失败"));
        }
    }

    public function index()
    {
        return (returnJson(msg: "成功"));
    }
    public function getScore($username)
    {
        $user = Db::table('tb_user_student')->where('username', $username)->find();
        if (!$user) {
            return (returnJson(1, '用户不存在'));
        }
        return (returnJson(0, 'success', $user['score']));
    }
    //允许学生自己加分 调用接口10000次加一分
    public function addScore($username)
    {
        $user = Db::table('tb_user_student')->where('username', $username)->find();
        if (!$user) {
            return (returnJson(1, '用户不存在'));
        }
        //调用接口10000次加10分
        //使用缓存记录调用次数
        $count = cache('addScore_' . $username);
//        if ($count >= 10000) {
//            return (returnJson(1, '调用次数已达上限'));
//        }
        cache('addScore_' . $username, $count + 1, 86400);

        if ($count >= 10000) {
            //加10分
            $res = Db::table('tb_user_student')->where('username', $username)->setInc('score', 10);
            if (!$res) {
                return (returnJson(1, '加分失败'));
            }
            return (returnJson(0, '加分成功'));
        }
            return (returnJson(0, 'success', '调用次数' . $count));

    }

    public function getUser()
    {
        $data = Db::table('tb_user')->select();
        return (returnJson(0, 'success', $data, count($data)));
    }

    public function getUserInfo()
    {
        $user = checkLogin();
        return (returnJson(0, 'success', $user));
    }

    public function getCaptcha()
    {
        return Captcha::create();
    }


    //获取积分排行榜
    public function getRankPoints()
    {
        //为了安全 只查询出ID username和points
        $data = Db::table('tb_user_student')->order('score desc')->field('id,username,score')->select()->toArray();
        //将id改成排名

        foreach ($data as $key => $value) {
            $data[$key]['id'] = $key + 1;
            //$data[$key]['username'] = mb_substr($value['username'], 0, 1) . '*'.mb_substr($value['username'], 2);
        }
        return (returnJson(0, 'success', $data, count($data)));
    }

//      此方法已在前端实现 已废弃
//    public function getMenu()
//    {
//        $user = checkLogin();
//        if ($user['type'] == 1) {
//            //return redirect('/static/data/menu/student.json');
//            return (returnJson(0, 'success', json_decode(file_get_contents('static/data/menu/student.json'))));
//        }
//        if ($user['type'] == 2) {
//            return (returnJson(0, 'success', json_decode(file_get_contents('static/data/menu/teacher.json'))));
//        }
//        if ($user['type'] == 3) {
//            return (returnJson(0, 'success', json_decode(file_get_contents('static/data/menu/admin.json'))));
//        }
//        return (returnJson(-1, '获取失败'));
//    }

    //获取课程表数据
//    public function getCourseList($page = 1, $limit = 10, $title = null)
//    {
//        $user = checkLogin();
//        if ($user['type'] == 0) {
//            $data = Db::table('tb_course')->join('tb_course_student', 'tb_course.id=tb_course_student.cid')->where('tb_course_student.sid', $user['uid'])
//                ->join('tb_record_subject', 'tb_course.subject=tb_record_subject.id');
//        }
//        if ($user['type'] == 1) {
//            $data = Db::table('tb_course')->where('tid', $user['uid']);
//        }
//
//        if ($user['type'] == 2) {
//            $data = Db::table('tb_course');
//        }
//        $data = $data->where('title', 'like', '%' . $title . '%');
//        $count = $data->count();
//        $data = $data->page($page, $limit)
//            ->join('tb_record_subject', 'tb_course.subject=tb_record_subject.id')
//            ->join('tb_user', 'tb_course.tid=tb_user.id')
//            ->join('tb_course_student', 'tb_course.id=tb_course_student.cid')
//            ->group('tb_course.id')
//            ->field('tb_course.*,tb_record_subject.name,tb_user.username as username,count(tb_course_student.id) as student_count')
//            ->select();
//        return (returnJson(0, 'success', $data, $count));
//    }

    //获取课程列表
    public function getCourseList($page = 1, $limit = 10, $id = '')
    {
        $user = checkLogin();
        if ($user['type'] == 0) {
            $id = $user['uid'];
        }
        $data = Db::table('tb_course');
        if ($id) {
            $data = $data->where('id', $id);
        }
        $count = $data->count();
        $data = $data->page($page, $limit)
            ->join('tb_record_subject', 'tb_course.subject=tb_record_subject.id')
            ->join('tb_user', 'tb_course.tid=tb_user.id')
            ->field('tb_course.*,tb_record_subject.name,tb_user.username as username')
            ->select();
        return (returnJson(0, 'success', $data, $count));
    }

    //获取课程类型列表
    public function getSubjectList()
    {
        $data = Db::table('tb_subject')->select();
        return (returnJson(0, 'success', $data, count($data)));
    }

    public function getClassList()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_class');

        $data = $data->field('id,title')->select();
        return (returnJson(0, 'success', $data));
    }

    //获取课程表
    public function getCourseTable($id = '')
    {
//        $user = checkLogin();
//        if ($user['type'] == 0) {
//            $id = $user['uid'];
//        }
        $data = Db::table('tb_course');
        if ($id) {
            $data = $data->where('id', $id);
        }
        $data = $data
            ->join('tb_subject', 'tb_course.sid=tb_subject.id')
            #->join('tb_user', 'tb_course.tid=tb_user.id')
            ->field('tb_course.*,tb_subject.name')
            ->select()->toArray();
        //转换成课程表格式
        $TimeList = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "19:00", "20:00", "21:00", "22:00"];
        #$weekList=["w1"=>"周一","w2"=>"周二","w3"=>"周三","w4"=>"周四","w5"=>"周五","w6"=>"周六","w7"=>"周日"];
        $weekList = ["1", "2", "3", "4", "5", "6", "7"];
        $weekList0 = ["w1", "w2", "w3", "w4", "w5", "w6", "w7"];
        $CourseTable = [];
        foreach ($TimeList as $key => $value) {
            $CourseTable[$key]['time'] = $value;
            foreach ($weekList as $k => $v) {
                //统计当前时间段
                $CourseTable[$key][$weekList0[$v - 1]] = 0;
                foreach ($data as $item) {
//                    if ($item['start_time'] == $value && $item['week'] == $v) {
//                        $CourseTable[$key][$v] = $item['name'];
//                    }
                    //如果当前时间在课程时间内
                    if ($item['start_time'] <= $value && $item['end_time'] >= $value && $item['week'] == $v) {
                        $CourseTable[$key][$weekList0[$v - 1]] += 1;
                    }

                }
                // $CourseTable[$k][$v]=$v;
                # $CourseTable[$k]['course']=[];

            }
        }
        return (returnJson(0, 'success', $CourseTable));

    }

}