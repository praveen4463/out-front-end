import React from 'react';
import SplitPane from 'react-split-pane';
import Editor from './Editor';
import RightPane from './RightPane';
import BottomPane from './BottomPane';
import LeftPane from './LeftPane';
import '../react-split-pane.css';

const Content = () => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 36,
        top: 48,
        right: 22,
        bottom: 22,
        height: 'auto',
      }}>
      <SplitPane
        split="horizontal"
        primary="second"
        defaultSize="20%"
        minSize={0}
        pane1Style={{
          maxHeight: '100%',
        }}
        pane2Style={{
          maxHeight: '50%',
        }}>
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <SplitPane
            split="vertical"
            defaultSize="20%"
            minSize={0}
            pane1Style={{
              maxWidth: '50%',
            }}
            pane2Style={{
              height: '100%',
            }}>
            <LeftPane />
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
              <SplitPane
                split="vertical"
                primary="second"
                defaultSize="30%"
                minSize={0}
                pane1Style={{
                  minWidth: 0,
                  maxWidth: '100%',
                }}
                pane2Style={{
                  maxWidth: '100%',
                }}>
                <Editor />
                <RightPane />
              </SplitPane>
            </div>
          </SplitPane>
        </div>
        <BottomPane />
      </SplitPane>
    </div>
  );
};

export default Content;
